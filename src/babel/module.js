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
  /* ::
  static invalidate: () => void;

  id: string;
  filename: string;
  paths: string;
  require: (id: string) => any;
  exports: any;

  transform: ?(text: string) => { code: string }
  */

  constructor(filename /* : string */) {
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
  }

  resolve(id /* : string */) {
    return NativeModule._resolveFilename(id, this);
  }

  require(id /* : string */) {
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

      if (/\.(js|json)$/.test(filename)) {
        // For JS/JSON files, we need to read the file first
        const code = fs.readFileSync(filename, 'utf-8');

        if (/\.json$/.test(filename)) {
          // For JSON files, parse it to a JS object similar to Node
          m.exports = JSON.parse(code);
        } else {
          // For JS files, evaluate the module
          m.evaluate(code);
        }
      } else {
        // For non JS/JSON requires, just export the filename
        // This is to support importing assets in webpack
        m.exports = filename;
      }
    }

    return m.exports;
  }

  evaluate(text /* : string */) {
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

module.exports = Module;
