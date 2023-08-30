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

import fs from 'fs';
import NativeModule from 'module';
import path from 'path';
import vm from 'vm';

import { invariant } from 'ts-invariant';

import type { Debugger } from '@linaria/logger';

import { TransformCacheCollection } from './cache';
import { Entrypoint } from './transform/Entrypoint';
import {
  createExports,
  getStack,
  isSuperSet,
  mergeOnly,
} from './transform/Entrypoint.helpers';
import type {
  IEntrypointDependency,
  IEvaluatedEntrypoint,
} from './transform/Entrypoint.types';
import { syncActionRunner } from './transform/actions/actionRunner';
import { baseProcessingHandlers } from './transform/generators/baseProcessingHandlers';
import { syncResolveImports } from './transform/generators/resolveImports';
import loadLinariaOptions from './transform/helpers/loadLinariaOptions';
import { withDefaultServices } from './transform/helpers/withDefaultServices';
import { createVmContext } from './vm/createVmContext';

type HiddenModuleMembers = {
  _extensions: { [key: string]: () => void };
  _nodeModulePaths(filename: string): string[];
  _resolveFilename: (
    id: string,
    options: { id: string; filename: string; paths: string[] }
  ) => string;
};

export const DefaultModuleImplementation = NativeModule as typeof NativeModule &
  HiddenModuleMembers;

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

const NOOP = () => {};

function getUncached(cached: string | string[], test: string[]): string[] {
  const cachedSet = new Set(
    typeof cached === 'string' ? cached.split(',') : cached
  );

  if (cachedSet.has('*')) {
    return [];
  }

  return test.filter((t) => !cachedSet.has(t));
}

class Module {
  #isEvaluated = false;

  readonly idx: string;

  id: string;

  ignored: boolean;

  parentIsIgnored: boolean;

  filename: string;

  imports: Map<string, string[]> | null;

  extensions: string[];

  dependencies: string[];

  debug: Debugger;

  readonly callstack: string[] = [];

  constructor(
    protected entrypoint: Entrypoint,
    private cache = new TransformCacheCollection(),
    parentModule?: Module,
    private moduleImpl: HiddenModuleMembers = DefaultModuleImplementation
  ) {
    this.idx = entrypoint.idx;
    this.id = entrypoint.name;
    this.filename = entrypoint.name;
    this.imports = null;
    this.dependencies = [];
    this.debug = entrypoint.log.extend('module');
    this.parentIsIgnored = parentModule?.ignored ?? false;
    this.ignored = entrypoint.ignored ?? this.parentIsIgnored;

    if (parentModule) {
      this.callstack = [...parentModule.callstack, parentModule.filename];
    } else {
      this.callstack = [];
    }

    this.extensions = entrypoint.pluginOptions.extensions;

    this.debug('init', entrypoint.name);
  }

  public get exports() {
    return this.entrypoint.exports;
  }

  public set exports(value) {
    this.entrypoint.exports = value;

    this.debug(
      'the whole exports was overridden with %O',
      this.entrypoint.exportsValues
    );
  }

  public get isEvaluated() {
    return this.#isEvaluated;
  }

  public set isEvaluated(value) {
    this.#isEvaluated = value;
  }

  resolveDependency = (id: string): IEntrypointDependency => {
    const cached = this.entrypoint.getDependency(id);
    invariant(!(cached instanceof Promise), 'Dependency is not resolved yet');

    if (cached) {
      return cached;
    }

    if (!this.ignored) {
      this.debug(
        '❌ import has not been resolved during prepare stage. Fallback to Node.js resolver'
      );
    }

    const extensions = this.moduleImpl._extensions;
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

      const { filename } = this;

      const resolved = this.moduleImpl._resolveFilename(id, {
        id: filename,
        filename,
        paths: this.moduleImpl._nodeModulePaths(path.dirname(filename)),
      });

      return {
        source: id,
        only: ['*'],
        resolved,
      };
    } finally {
      // Cleanup the extensions we added to restore previous behaviour
      added.forEach((ext) => delete extensions[ext]);
    }
  };

  resolve = (id: string): string => {
    const { resolved } = this.resolveDependency(id);
    invariant(resolved, `Unable to resolve "${id}"`);
    return resolved;
  };

  getEntrypoint(
    filename: string,
    only: string[],
    log: Debugger
  ): Entrypoint | IEvaluatedEntrypoint | null {
    const extension = path.extname(filename);
    if (extension !== '.json' && !this.extensions.includes(extension)) {
      return null;
    }

    const entrypoint = this.cache.get('entrypoints', filename);
    if (entrypoint && isSuperSet(entrypoint.evaluatedOnly ?? [], only)) {
      log('✅ file has been already evaluated');
      return entrypoint;
    }

    if (entrypoint?.ignored) {
      log(
        '✅ file has been ignored during prepare stage. Original code will be used'
      );
      return entrypoint;
    }

    if (this.ignored) {
      log(
        '✅ one of the parent files has been ignored during prepare stage. Original code will be used'
      );

      const newEntrypoint = this.entrypoint.createChild(
        filename,
        ['*'],
        fs.readFileSync(filename, 'utf-8')
      );

      if (newEntrypoint === 'loop') {
        const stack = getStack(this.entrypoint);
        throw new Error(
          `Circular dependency detected: ${stack.join(' -> ')} -> ${filename}`
        );
      }

      return newEntrypoint;
    }

    // Requested file can be already prepared for evaluation on the stage 1
    if (only && entrypoint) {
      const uncachedExports = getUncached(entrypoint.only ?? [], only);
      if (uncachedExports.length === 0) {
        log('✅ ready for evaluation');
        return entrypoint;
      }

      log(
        '❌ file has been processed during prepare stage but %o is not evaluated yet (evaluated: %o)',
        uncachedExports,
        entrypoint.only
      );
    } else {
      log('❌ file has not been processed during prepare stage');
    }

    // If code wasn't extracted from cache, it indicates that we were unable
    // to process some of the imports on stage1. Let's try to reprocess.
    const services = withDefaultServices({
      cache: this.cache,
      options: {
        filename,
      },
    });

    const syncResolve = (what: string, importer: string): string => {
      return this.moduleImpl._resolveFilename(what, {
        id: importer,
        filename: importer,
        paths: this.moduleImpl._nodeModulePaths(path.dirname(importer)),
      });
    };

    const pluginOptions = loadLinariaOptions({});
    const code = fs.readFileSync(filename, 'utf-8');
    const newEntrypoint = Entrypoint.createRoot(
      services,
      filename,
      only,
      code,
      pluginOptions
    );

    if (newEntrypoint.evaluated) {
      log('✅ file has been already evaluated');
      return newEntrypoint;
    }

    if (newEntrypoint.ignored) {
      log(
        '✅ file has been ignored during prepare stage. Original code will be used'
      );
      return newEntrypoint;
    }

    const action = newEntrypoint.createAction('processEntrypoint', undefined);
    syncActionRunner(action, {
      ...baseProcessingHandlers,
      resolveImports() {
        return syncResolveImports.call(this, syncResolve);
      },
    });

    return newEntrypoint;
  }

  require: {
    (id: string): unknown;
    resolve: (id: string) => string;
    ensure: () => void;
  } = Object.assign(
    (id: string) => {
      if (id in builtins) {
        // The module is in the allowed list of builtin node modules
        // Ideally we should prevent importing them, but webpack polyfills some
        // So we check for the list of polyfills to determine which ones to support
        if (builtins[id as keyof typeof builtins]) {
          this.debug('require', `builtin '${id}'`);
          return require(id);
        }

        return null;
      }

      // Resolve module id (and filename) relatively to parent module
      const dependency = this.resolveDependency(id);
      if (dependency.resolved === id && !path.isAbsolute(id)) {
        // The module is a builtin node modules, but not in the allowed list
        throw new Error(
          `Unable to import "${id}". Importing Node builtins is not supported in the sandbox.`
        );
      }

      invariant(
        dependency.resolved,
        `Dependency ${dependency.source} cannot be resolved`
      );

      this.dependencies.push(id);

      this.debug('require', `${id} -> ${dependency.resolved}`);

      const entrypoint = this.getEntrypoint(
        dependency.resolved,
        dependency.only,
        this.debug
      );

      if (entrypoint === null) {
        return dependency.resolved;
      }

      if (
        entrypoint.evaluated ||
        isSuperSet(entrypoint.evaluatedOnly, dependency.only)
      ) {
        return createExports(entrypoint, this.debug);
      }

      const m = new Module(entrypoint, this.cache, this);
      m.evaluate();

      return entrypoint.exports;
    },
    {
      ensure: NOOP,
      resolve: this.resolve,
    }
  );

  evaluate(): void {
    const { entrypoint } = this;

    this.cache.add('entrypoints', entrypoint.name, {
      evaluated: true,
      evaluatedOnly: mergeOnly(entrypoint.evaluatedOnly, entrypoint.only),
      exportsValues: entrypoint.exportsValues,
      generation: entrypoint.generation + 1,
      ignored: false,
      log: entrypoint.log,
      only: entrypoint.only,
    });

    const source = entrypoint.transformedCode ?? entrypoint.originalCode;

    if (!source) {
      this.debug(`evaluate`, 'there is nothing to evaluate');
      return;
    }

    if (this.isEvaluated) {
      this.debug('evaluate', `is already evaluated`);
      return;
    }

    this.debug('evaluate');
    this.debug.extend('source')('%s', source);

    this.isEvaluated = true;

    const { filename } = this;

    if (/\.json$/.test(filename)) {
      // For JSON files, parse it to a JS object similar to Node
      this.exports = JSON.parse(source);
      return;
    }

    const { context, teardown } = createVmContext(
      filename,
      entrypoint.pluginOptions.features,
      {
        module: this,
        exports: entrypoint.exports,
        require: this.require,
        __linaria_dynamic_import: async (id: string) => this.require(id),
        __dirname: path.dirname(filename),
      }
    );

    try {
      const script = new vm.Script(
        `(function (exports) { ${source}\n})(exports);`,
        {
          filename,
        }
      );

      script.runInContext(context);
    } catch (e) {
      if (e instanceof EvalError) {
        this.debug('%O', e);

        throw e;
      }

      this.debug('%O\n%O', e, this.callstack);
      throw new EvalError(
        `${(e as Error).message} in${this.callstack.join('\n| ')}\n`
      );
    } finally {
      teardown();
    }
  }
}

export default Module;
