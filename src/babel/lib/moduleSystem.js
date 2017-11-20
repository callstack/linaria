/* @flow */

/*
 * ==============================================
 * To avoid leakage from evaled code to module cache in current context,
 * for example with `babel-register` we provide our custom module system.
 * It's designed to mimic the native node one, with the exception being
 * that we can transpile every module by default and store source maps
 * for it. As a result we can provide correct error stacktrace and
 * enhanced errors.
 * ==============================================
 */

import path from 'path';
import fs from 'fs';
import vm from 'vm';
// $FlowFixMe
import NativeModule from 'module';
import * as babel from 'babel-core';

import {
  buildCodeFrameError,
  enhanceFrames,
  getFramesFromStack,
} from './errorUtils';

type Exports = any;

/**
 * Separate cache for evaled modules, so that we don't have to worry about
 * babel-register leaking to main context.
 */
const modulesCache: { [key: string]: Module } = {};

/**
 * Resolve module id (and filename) relatively to parent module if specified.
 */
function resolveModuleId(moduleId: string, parent: ?Module): string {
  return NativeModule._resolveFilename(moduleId, parent, false);
}

/**
 * Create module instance and store it in cache.
 */
export function instantiateModule(
  code: string,
  filename: string,
  parent: ?Module
): Module {
  const moduleInstance = new Module(filename, parent);
  // Store it in cache at this point with loaded: false flag, otherwise
  // we would end up in infinite loop, with cycle dependencies.
  modulesCache[filename] = moduleInstance;

  moduleInstance._compile(code);
  moduleInstance.loaded = true;
  return moduleInstance;
}

/*
 * =====================================
 * Module class used internally and to
 * mock the native Node `module` with
 * exposed methods.
 * =====================================
 */

export class Module {
  id: string;
  filename: string;
  loaded: boolean = false;
  exports: Exports = {};
  parent: ?Module;
  paths: string[] = [];
  children: Module[] = [];
  sourceMap: ?Object;

  constructor(filename: string, parent: ?Module) {
    this.id = filename;
    this.filename = filename;
    this.parent = parent;
    if (this.parent) {
      this.parent.children.push(this);
    }
  }

  /**
   * Transpile and eval the module.
   */
  _compile(code: string, altFilename?: string): Exports {
    const filename = altFilename || this.filename;

    if (/\.json$/.test(filename)) {
      try {
        this.exports = JSON.parse(code);
      } catch (error) {
        throw new Error(`${error.message} (${filename})`);
      }

      return this.exports;
    }

    // Transpile module implementation.
    const { code: moduleBody, map } = babel.transform(code, {
      plugins: [
        require.resolve('babel-plugin-transform-es2015-modules-commonjs'),
      ],
      filename,
      sourceMaps: true,
      ignore: /node_modules/,
    });

    this.paths = NativeModule._nodeModulePaths(path.dirname(filename));
    this.sourceMap = map;

    // Load module.
    try {
      // Create script object with module wrapper.
      const script = new vm.Script(ModuleMock.wrap(moduleBody), {
        filename,
      });

      // Run the script to get the wrapper function.
      const loader = script.runInThisContext();

      // Compile the module with custom module system.
      loader(
        this.exports,
        getRequireMock(this),
        this,
        filename,
        path.dirname(filename)
      );
    } catch (error) {
      if (error.isEnhanced) {
        throw buildCodeFrameError(error, error.enhancedFrames);
      } else {
        let errorToThrow;
        try {
          errorToThrow = buildCodeFrameError(
            error,
            enhanceFrames(
              getFramesFromStack(error, frames =>
                frames.findIndex(frame => frame.fileName === filename)
              ),
              modulesCache
            )
          );
        } catch (_) {
          errorToThrow = error;
        }
        throw errorToThrow;
      }
    }

    return this.exports;
  }

  load(altFilename?: string) {
    const filename = altFilename || this.filename;
    let extension = path.extname(filename) || '.js';
    if (!ModuleMock._extensions[extension]) {
      extension = '.js';
    }
    ModuleMock._extensions[extension](this, filename);
    // Toggle loaded flag.
    this.loaded = true;
  }

  require(moduleId: string): Exports {
    return getRequireMock(this)(moduleId);
  }
}

/*
 * =====================================
 * Native Node `module` mock.
 * =====================================
 */

export function ModuleMock(filename: string, parent: ?Module): Module {
  return new Module(filename, parent);
}

// Copy all function from native node `module`.
Object.keys(NativeModule).forEach(key => {
  ModuleMock[key] = NativeModule[key];
});

ModuleMock.wrap = code =>
  `${NativeModule.wrapper[0]}${code}${NativeModule.wrapper[1]}`;
ModuleMock._cache = modulesCache;
ModuleMock._debug = () => {}; // noop
ModuleMock._load = (moduleId: string, parent: ?Module) =>
  getRequireMock(parent)(moduleId);
ModuleMock._preloadModules = () => {}; // noop
ModuleMock.Module = ModuleMock;

const ModuleMockId = resolveModuleId('module');
modulesCache[ModuleMockId] = new Module(ModuleMockId);
modulesCache[ModuleMockId].loaded = true;
modulesCache[ModuleMockId].exports = ModuleMock;

/*
 * =====================================
 * Require and resolve mocks.
 * =====================================
 */

/**
 * Get mocked require function for specific parent,
 * so that it can resolve other modules relative to
 * parent module.
 */
function getRequireMock(parent: ?Module) {
  function resolveMock(moduleId: string): string {
    return resolveModuleId(moduleId, parent);
  }

  function requireMock(moduleId: string): Exports {
    /**
     * For non JS/JSON requires, we create a dummy wrapper module and just export
     * the moduleId from it, thus letting the bundler handle the rest.
     */
    if (/\.(?!js)[a-zA-Z0-9]+$/.test(moduleId)) {
      return instantiateModule(
        `module.exports = '${moduleId}'`,
        moduleId,
        parent
      ).exports;
    }

    const filename = resolveMock(moduleId);

    // Native Node modules
    if (filename === moduleId && !path.isAbsolute(moduleId)) {
      // $FlowFixMe
      return require(moduleId); // eslint-disable-line global-require
    }

    // Return cached module if available.
    if (modulesCache[filename]) {
      return modulesCache[filename].exports;
    }

    const code = fs.readFileSync(filename, 'utf-8');
    return instantiateModule(code, filename, parent).exports;
  }

  // Provide utilities on require function.
  requireMock.resolve = resolveMock;
  // In our case main will never be set to anything other than undefined,
  // because we never run js module directly with `node module.js`.
  requireMock.main = undefined;
  // $FlowFixMe
  requireMock.extensions = require.extensions;
  requireMock.cache = modulesCache;

  return requireMock;
}

/*
 * =====================================
 * Utils for modules cache manipulation.
 * =====================================
 */

/**
 * Get module instance from cache.
 */
export function getCachedModule(moduleId: string): Module {
  return modulesCache[moduleId];
}

/**
 * Clear modules from cache which are neither from node_modules nor from linaria.
 */
export function clearLocalModulesFromCache() {
  Object.keys(modulesCache)
    .filter(
      moduleId =>
        !/node_modules/.test(moduleId) && !/linaria\/(build|src)/.test(moduleId)
    )
    .forEach(moduleId => {
      delete modulesCache[moduleId];
    });
}

export function clearModulesCache() {
  Object.keys(modulesCache).forEach(moduleId => {
    delete modulesCache[moduleId];
  });
}
