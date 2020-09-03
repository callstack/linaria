// TypeScript Version: 3.2

/**
 * This is a custom implementation for the module system for evaluating code,
 * used for resolving values for dependencies interpolated in `css` or `styled`.
 *
 * This serves 2 purposes:
 * - Avoid leakage from evaluated code to module cache in current context, e.g. `babel-register`
 * - Allow us to invalidate the module cache without affecting other stuff, necessary for rebuilds
 *
 * We also use it to transpile the code with Babel by default.
 * We also store source maps for it to provide correct error stacktraces.
 *
 */

import NativeModule from 'module';
import vm from 'vm';
import fs from 'fs';
import path from 'path';
import type { BabelFileResult } from '@babel/core';
import * as EvalCache from './eval-cache';
import * as process from './process';
import { debug } from './utils/logger';
import type { Evaluator, StrictOptions } from './types';

// Supported node builtins based on the modules polyfilled by webpack
// `true` means module is polyfilled, `false` means module is empty
const builtins = {
  assert: true,
  buffer: true,
  child_process: false,
  cluster: false,
  console: true,
  constants: true,
  crypto: true,
  dgram: false,
  dns: false,
  domain: true,
  events: true,
  fs: false,
  http: true,
  https: true,
  module: false,
  net: false,
  os: true,
  path: true,
  punycode: true,
  process: true,
  querystring: true,
  readline: false,
  repl: false,
  stream: true,
  string_decoder: true,
  sys: true,
  timers: true,
  tls: false,
  tty: true,
  url: true,
  util: true,
  vm: true,
  zlib: true,
};

// Separate cache for evaluated modules
let cache: { [id: string]: Module } = {};

const NOOP = () => {};

const createCustomDebug = (depth: number) => (
  ..._args: Parameters<typeof debug>
) => {
  const [namespaces, arg1, ...args] = _args;
  const modulePrefix = depth === 0 ? 'module' : `sub-module-${depth}`;
  debug(`${modulePrefix}:${namespaces}`, arg1, ...args);
};

class Module {
  static invalidate: () => void;
  static invalidateEvalCache: () => void;
  static _resolveFilename: (
    id: string,
    options: { id: string; filename: string; paths: string[] }
  ) => string;
  static _nodeModulePaths: (filename: string) => string[];

  id: string;
  filename: string;
  options: StrictOptions;
  imports: Map<string, string[]> | null;
  paths: string[];
  exports: any;
  extensions: string[];
  dependencies: string[] | null;
  transform: ((text: string) => BabelFileResult | null) | null;
  debug: typeof debug;
  debuggerDepth: number;

  constructor(
    filename: string,
    options: StrictOptions,
    debuggerDepth: number = 0
  ) {
    this.id = filename;
    this.filename = filename;
    this.options = options;
    this.imports = null;
    this.paths = [];
    this.dependencies = null;
    this.transform = null;
    this.debug = createCustomDebug(debuggerDepth);
    this.debuggerDepth = debuggerDepth;

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
          ((NativeModule as unknown) as {
            _nodeModulePaths(filename: string): string[];
          })._nodeModulePaths(path.dirname(filename))
        ),
        writable: false,
      },
    });

    this.exports = {};

    // We support following extensions by default
    this.extensions = ['.json', '.js', '.jsx', '.ts', '.tsx'];
    this.debug('prepare', filename);
  }

  resolve = (id: string) => {
    const extensions = ((NativeModule as unknown) as {
      _extensions: { [key: string]: Function };
    })._extensions;
    const added: string[] = [];

    try {
      // Check for supported extensions
      this.extensions.forEach((ext) => {
        if (ext in extensions) {
          return;
        }

        // When an extension is not supported, add it
        // And keep track of it to clean it up after resolving
        // Use noop for the transform function since we handle it
        extensions[ext] = NOOP;
        added.push(ext);
      });

      return Module._resolveFilename(id, this);
    } finally {
      // Cleanup the extensions we added to restore previous behaviour
      added.forEach((ext) => delete extensions[ext]);
    }
  };

  require: {
    (id: string): any;
    resolve: (id: string) => string;
    ensure: () => void;
    cache: typeof cache;
  } = Object.assign(
    (id: string) => {
      this.debug('require', id);
      if (id in builtins) {
        // The module is in the allowed list of builtin node modules
        // Ideally we should prevent importing them, but webpack polyfills some
        // So we check for the list of polyfills to determine which ones to support
        if (builtins[id as keyof typeof builtins]) {
          return require(id);
        }

        return null;
      }

      // Resolve module id (and filename) relatively to parent module
      const filename = this.resolve(id);
      if (filename === id && !path.isAbsolute(id)) {
        // The module is a builtin node modules, but not in the allowed list
        throw new Error(
          `Unable to import "${id}". Importing Node builtins is not supported in the sandbox.`
        );
      }

      this.dependencies?.push(id);

      let cacheKey = filename;
      let only: string[] = [];
      if (this.imports?.has(id)) {
        // We know what exactly we need from this module. Let's shake it!
        only = this.imports.get(id)!.sort();
        if (only.length === 0) {
          // Probably the module is used as a value itself
          // like `'The answer is ' + require('./module')`
          only = ['default'];
        }

        cacheKey += `:${only.join(',')}`;
      }

      let m = cache[cacheKey];

      if (!m) {
        this.debug('cached:not-exist', id);
        // Create the module if cached module is not available
        m = new Module(filename, this.options, this.debuggerDepth + 1);
        m.transform = this.transform;

        // Store it in cache at this point with, otherwise
        // we would end up in infinite loop with cyclic dependencies
        cache[cacheKey] = m;

        if (this.extensions.includes(path.extname(filename))) {
          // To evaluate the file, we need to read it first
          const code = fs.readFileSync(filename, 'utf-8');
          if (/\.json$/.test(filename)) {
            // For JSON files, parse it to a JS object similar to Node
            m.exports = JSON.parse(code);
          } else {
            // For JS/TS files, evaluate the module
            // The module will be transpiled using provided transform
            m.evaluate(code, only.includes('*') ? null : only);
          }
        } else {
          // For non JS/JSON requires, just export the id
          // This is to support importing assets in webpack
          // The module will be resolved by css-loader
          m.exports = id;
        }
      } else {
        this.debug('cached:exist', id);
      }

      return m.exports;
    },
    {
      ensure: NOOP,
      cache,
      resolve: this.resolve,
    }
  );

  evaluate(text: string, only: string[] | null = null) {
    const filename = this.filename;
    const matchedRules = this.options.rules
      .filter(({ test }) => {
        if (!test) {
          return true;
        }

        if (typeof test === 'function') {
          // this is not a test
          // eslint-disable-next-line jest/no-disabled-tests
          return test(filename);
        }

        if (test instanceof RegExp) {
          return test.test(filename);
        }

        return false;
      })
      .reverse();

    const cacheKey = [this.filename, ...(only ?? [])];

    if (EvalCache.has(cacheKey, text)) {
      this.exports = EvalCache.get(cacheKey, text);
      return;
    }

    let code: string | null | undefined;
    const action = matchedRules.length > 0 ? matchedRules[0].action : 'ignore';
    if (action === 'ignore') {
      this.debug('ignore', `${filename}`);
      code = text;
    } else {
      // Action can be a function or a module name
      const evaluator: Evaluator =
        typeof action === 'function' ? action : require(action).default;

      // For JavaScript files, we need to transpile it and to get the exports of the module
      let imports: Module['imports'];

      this.debug('prepare-evaluation', this.filename, 'using', evaluator.name);

      [code, imports] = evaluator(this.filename, this.options, text, only);
      this.imports = imports;

      this.debug(
        'evaluate',
        `${this.filename} (only ${(only || []).join(', ')}):\n${code}`
      );
    }

    const script = new vm.Script(
      `(function (exports) { ${code}\n})(exports);`,
      {
        filename: this.filename,
      }
    );

    script.runInContext(
      vm.createContext({
        clearImmediate: NOOP,
        clearInterval: NOOP,
        clearTimeout: NOOP,
        setImmediate: NOOP,
        setInterval: NOOP,
        setTimeout: NOOP,
        global,
        process,
        module: this,
        exports: this.exports,
        require: this.require,
        __filename: this.filename,
        __dirname: path.dirname(this.filename),
      })
    );

    EvalCache.set(cacheKey, text, this.exports);
  }
}

Module.invalidate = () => {
  cache = {};
};

Module.invalidateEvalCache = () => {
  EvalCache.clear();
};

// Alias to resolve the module using node's resolve algorithm
// This static property can be overriden by the webpack loader
// This allows us to use webpack's module resolution algorithm
Module._resolveFilename = (id, options) =>
  ((NativeModule as unknown) as {
    _resolveFilename: (id: string, options: any) => string;
  })._resolveFilename(id, options);

Module._nodeModulePaths = (filename: string) =>
  ((NativeModule as unknown) as {
    _nodeModulePaths: (filename: string) => string[];
  })._nodeModulePaths(filename);

export default Module;
