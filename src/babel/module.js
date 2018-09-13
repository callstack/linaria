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
const babel = require('@babel/core');

// Separate cache for evaled modules
let cache = {};

class Module {
  /*::
  static invalidate: () => void;

  id: string;
  filename: string;
  paths: string;
  exports: any;

  sourceMap: any;
  */

  constructor(filename /* : string */) {
    this.id = filename;
    this.filename = filename;
    this.exports = {};
    this.paths = NativeModule._nodeModulePaths(path.dirname(this.filename));
  }

  resolve(id /* : string */) {
    return NativeModule._resolveFilename(id, this);
  }

  require(id /* : string */) {
    // Resolve module id (and filename) relatively to parent module
    const filename = this.resolve(id);

    if (filename === id && !path.isAbsolute(id)) {
      // Native Node modules
      /* $FlowFixMe */
      return require(id);
    }

    let m = cache[filename];

    if (!m) {
      // Create the module if cached module is not available
      m = new Module(filename);

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
    const { code, map } = babel.transformSync(text, {
      filename: this.filename,
      presets: [require.resolve('../babel')],
      // Include this plugin to avoid extra config when using { module: false } for webpack
      plugins: ['@babel/plugin-transform-modules-commonjs'],
      sourceMaps: true,
      exclude: /node_modules/,
    });

    this.sourceMap = map;

    const script = new vm.Script(code, {
      filename: this.filename,
    });

    const requireImpl = this.require.bind(this);

    // Make require.resolve work
    requireImpl.resolve = this.resolve.bind(this);

    script.runInContext(
      vm.createContext({
        module: this,
        exports: this.exports,
        require: requireImpl,
        process: {
          env: {
            NODE_ENV: process.env.NODE_ENV,
          },
        },
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
