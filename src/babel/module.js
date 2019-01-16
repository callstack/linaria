/**
 * This is a custom implementation for the module system for evaluating code.
 *
 * This serves 2 purposes:
 * - Avoid leakage from evaled code to module cache in current context, e.g. `babel-register`
 * - Allow us to invalidate the module cache without affecting other stuff, necessary for rebuilds
 *
 * We also use it to transpile the code with Babel by default.
 * We also store source maps for it to provide correct error stacktraces.
 *
 * @flow
 */

/* $FlowFixMe */
const NativeModule = require('module');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

// Separate cache for evaled modules
let cache = {};

const NOOP = () => {};

class Module {
  static invalidate: () => void;

  static _resolveFilename: (
    id: string,
    options: { id: string, filename: string, paths: string[] }
  ) => string;

  id: string;

  filename: string;

  paths: string[];

  require: (id: string) => any;

  exports: any;

  extensions: string[];

  transform: ?(text: string) => { code: string };

  constructor(filename: string) {
    Object.defineProperties(this, {
      id: {
        value: filename,
        writable: false,
      },
      filename: {
        value: filename,
        writable: false,
      },
      paths: {
        value: Object.freeze(
          NativeModule._nodeModulePaths(path.dirname(filename))
        ),
        writable: false,
      },
    });

    this.exports = {};
    this.require = this.require.bind(this);
    this.require.resolve = this.resolve.bind(this);
    this.require.ensure = NOOP;
    this.require.cache = cache;

    // We support following extensions by default
    this.extensions = ['.json', '.js', '.ts', '.tsx'];
  }

  resolve(id: string) {
    const extensions = NativeModule._extensions;
    const added = [];

    try {
      // Check for supported extensions
      this.extensions.forEach(ext => {
        if (ext in extensions) {
          return;
        }

        // When an extension is not supported, add it
        // And keep track of it to clean it up after resolving
        // Use noop for the tranform function since we handle it
        extensions[ext] = NOOP;
        added.push(ext);
      });

      return Module._resolveFilename(id, this);
    } finally {
      // Cleanup the extensions we added to restore previous behaviour
      added.forEach(ext => delete extensions[ext]);
    }
  }

  require(id: string) {
    // Resolve module id (and filename) relatively to parent module
    const filename = this.resolve(id);

    if (filename === id && !path.isAbsolute(id)) {
      // Native Node modules
      throw new Error(
        `Unable to import "${id}". Importing Node builtins is not supported in the sandbox.`
      );
    }

    let m = cache[filename];

    if (!m) {
      // Create the module if cached module is not available
      m = new Module(filename);
      m.transform = this.transform;

      // Store it in cache at this point with, otherwise
      // we would end up in infinite loop with cyclic dependencies
      cache[filename] = m;

      if (this.extensions.includes(path.extname(filename))) {
        // To evaluate the file, we need to read it first
        const code = fs.readFileSync(filename, 'utf-8');

        if (/\.json$/.test(filename)) {
          // For JSON files, parse it to a JS object similar to Node
          m.exports = JSON.parse(code);
        } else {
          // For JS/TS files, evaluate the module
          // The module will be transpiled using provided transform
          m.evaluate(code);
        }
      } else {
        // For non JS/JSON requires, just export the id
        // This is to support importing assets in webpack
        // The module will be resolved by css-loader
        m.exports = id;
      }
    }

    return m.exports;
  }

  evaluate(text: string) {
    // For JavaScript files, we need to transpile it and to get the exports of the module
    const code = this.transform ? this.transform(text).code : text;

    const script = new vm.Script(code, {
      filename: this.filename,
    });

    script.runInContext(
      vm.createContext({
        module: this,
        exports: this.exports,
        require: this.require,
        process: Object.freeze({
          env: Object.freeze({
            NODE_ENV: process.env.NODE_ENV,
          }),
        }),
        __filename: this.filename,
        __dirname: path.dirname(this.filename),
      })
    );
  }
}

Module.invalidate = () => {
  cache = {};
};

// Alias to resolve the module using node's resolve algorithm
// This static property can be overriden by the webpack loader
// This allows us to use webpack's module resolution algorithm
Module._resolveFilename = (id, options) =>
  NativeModule._resolveFilename(id, options);

module.exports = Module;
