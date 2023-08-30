import { readFileSync } from 'fs';
import { dirname, extname } from 'path';

import type { TransformOptions, PluginItem } from '@babel/core';
import type { File } from '@babel/types';

import type { Debugger } from '@linaria/logger';
import { createCustomDebug } from '@linaria/logger';
import type { EvalRule, Evaluator, StrictOptions } from '@linaria/utils';
import {
  buildOptions,
  getFileIdx,
  getPluginKey,
  loadBabelOptions,
} from '@linaria/utils';

import type { Core } from '../babel';
import type { ParentEntrypoint } from '../types';

import type { IEntrypointCode, IIgnoredEntrypoint } from './Entrypoint.types';
import { StackOfMaps } from './helpers/StackOfMaps';
import type { Services } from './types';

export function getMatchedRule(
  rules: EvalRule[],
  filename: string,
  code: string
): EvalRule {
  for (let i = rules.length - 1; i >= 0; i--) {
    const rule = rules[i];
    if (!rule.test) {
      return rule;
    }

    if (typeof rule.test === 'function' && rule.test(filename, code)) {
      return rule;
    }

    if (rule.test instanceof RegExp && rule.test.test(filename)) {
      return rule;
    }
  }

  return { action: 'ignore' };
}

export function parseFile(
  babel: Core,
  filename: string,
  originalCode: string,
  parseConfig: TransformOptions
): File {
  const log = createCustomDebug('transform:parse', getFileIdx(filename));

  const parseResult = babel.parseSync(originalCode, parseConfig);
  if (!parseResult) {
    throw new Error(`Failed to parse ${filename}`);
  }

  log('stage-1', `${filename} has been parsed`);

  return parseResult;
}

const isModuleResolver = (plugin: PluginItem) => {
  const key = getPluginKey(plugin);
  if (!key) return false;

  if (['module-resolver', 'babel-plugin-module-resolver'].includes(key)) {
    return true;
  }

  return /([\\/])babel-plugin-module-resolver\1/.test(key);
};

let moduleResolverWarned = false;

function buildConfigs(
  services: Services,
  name: string,
  pluginOptions: StrictOptions,
  babelOptions: TransformOptions | undefined
): {
  evalConfig: TransformOptions;
  parseConfig: TransformOptions;
} {
  const { babel, options } = services;

  const commonOptions = {
    ast: true,
    filename: name,
    inputSourceMap: options.inputSourceMap,
    root: options.root,
    sourceFileName: name,
    sourceMaps: true,
  };

  const rawConfig = buildOptions(
    pluginOptions?.babelOptions,
    babelOptions,
    commonOptions
  );

  const parseConfig = loadBabelOptions(babel, name, {
    babelrc: true,
    ...rawConfig,
  });

  const parseHasModuleResolver = parseConfig.plugins?.some(isModuleResolver);
  const rawHasModuleResolver = rawConfig.plugins?.some(isModuleResolver);

  if (parseHasModuleResolver && !rawHasModuleResolver) {
    if (!moduleResolverWarned) {
      // eslint-disable-next-line no-console
      console.warn(
        `[linaria] ${name} has a module-resolver plugin in its babelrc, but it is not present ` +
          `in the babelOptions for the linaria plugin. This works for now but will be an error in the future. ` +
          `Please add the module-resolver plugin to the babelOptions for the linaria plugin.`
      );

      moduleResolverWarned = true;
    }

    rawConfig.plugins = [
      ...(parseConfig.plugins?.filter((plugin) => isModuleResolver(plugin)) ??
        []),
      ...(rawConfig.plugins ?? []),
    ];
  }

  const evalConfig = loadBabelOptions(babel, name, {
    babelrc: false,
    ...rawConfig,
  });

  return {
    evalConfig,
    parseConfig,
  };
}

export function loadAndParse(
  services: Services,
  name: string,
  loadedCode: string | undefined,
  log: Debugger,
  pluginOptions: StrictOptions
): IEntrypointCode | IIgnoredEntrypoint {
  const { babel, eventEmitter } = services;

  const extension = extname(name);

  if (!pluginOptions.extensions.includes(extension)) {
    log(
      '[createEntrypoint] %s is ignored. If you want it to be processed, you should add \'%s\' to the "extensions" option.',
      name,
      extension
    );

    return {
      code: undefined,
      evaluator: 'ignored',
      reason: 'extension',
    };
  }

  const code = loadedCode ?? readFileSync(name, 'utf-8');

  const { action, babelOptions } = getMatchedRule(
    pluginOptions.rules,
    name,
    code
  );

  if (action === 'ignore') {
    log('[createEntrypoint] %s is ignored by rule', name);
    return {
      code,
      evaluator: 'ignored',
      reason: 'rule',
    };
  }

  const evaluator: Evaluator =
    typeof action === 'function'
      ? action
      : require(require.resolve(action, {
          paths: [dirname(name)],
        })).default;

  const { evalConfig, parseConfig } = buildConfigs(
    services,
    name,
    pluginOptions,
    babelOptions
  );

  const ast: File = eventEmitter.pair({ method: 'parseFile' }, () =>
    parseFile(babel, name, code, parseConfig)
  );

  return {
    ast,
    code,
    evaluator,
    evalConfig,
  };
}

export const getIdx = (fn: string) =>
  getFileIdx(fn).toString().padStart(5, '0');

export function getStack(entrypoint: ParentEntrypoint) {
  if (!entrypoint) return [];

  const stack = [entrypoint.name];

  let { parent } = entrypoint;
  while (parent) {
    stack.push(parent.name);
    parent = parent.parent;
  }

  return stack;
}

export function mergeOnly(a: string[], b: string[]) {
  const result = new Set(a);
  b.forEach((item) => result.add(item));
  return [...result].filter((i) => i).sort();
}

export const isSuperSet = <T>(a: (T | '*')[], b: (T | '*')[]) => {
  if (a.includes('*')) return true;
  if (b.length === 0) return true;
  const aSet = new Set(a);
  return b.every((item) => aSet.has(item));
};

const hasKey = <TKey extends string | symbol>(
  obj: unknown,
  key: TKey
): obj is Record<TKey, unknown> =>
  (typeof obj === 'object' || typeof obj === 'function') &&
  obj !== null &&
  key in obj;

const VALUES = Symbol('values');

export const isProxy = (
  obj: unknown
): obj is { [VALUES]: StackOfMaps<string | symbol, unknown> } =>
  typeof obj === 'object' && obj !== null && VALUES in obj;

export const getLazyValues = (obj: unknown) => {
  if (isProxy(obj)) {
    return obj[VALUES];
  }

  if (obj instanceof StackOfMaps) {
    return obj;
  }

  return new StackOfMaps<string | symbol, unknown>();
};

export const createExports = (
  container: {
    readonly exportsValues: StackOfMaps<string | symbol, unknown>;
  },
  log: Debugger
) => {
  const exports: Record<string | symbol, unknown> = {};

  return new Proxy(exports, {
    get: (target, key) => {
      if (key === VALUES) {
        return container.exportsValues;
      }

      let value: unknown;
      if (container.exportsValues.has(key)) {
        value = container.exportsValues.get(key);
      } else {
        // Support Object.prototype methods on `exports`
        // e.g `exports.hasOwnProperty`
        value = Reflect.get(target, key);
      }

      if (value === undefined && container.exportsValues.has('default')) {
        const defaultValue = container.exportsValues.get('default');
        if (hasKey(defaultValue, key)) {
          log(
            '⚠️  %s has been found in `default`. It indicates that ESM to CJS conversion went wrong.',
            key
          );
          value = defaultValue[key];
        }
      }

      log('get %s: %o', key, value);
      return value;
    },
    has: (target, key) => {
      if (key === VALUES) return true;
      return container.exportsValues.has(key);
    },
    ownKeys: () => {
      return Array.from(container.exportsValues.keys());
    },
    set: (target, key, value) => {
      if (key !== '__esModule') {
        log('set %s: %o', key, value);
      }

      if (value !== undefined) {
        container.exportsValues.set(key, value);
      }

      return true;
    },
    defineProperty: (target, key, descriptor) => {
      const { value } = descriptor;
      if (value !== undefined) {
        if (key !== '__esModule') {
          log('defineProperty %s with value %o', key, value);
        }

        container.exportsValues.set(key, value);

        return true;
      }

      if ('get' in descriptor) {
        container.exportsValues.setLazy(key, descriptor.get!);
        log('defineProperty %s with getter', key);
      }

      return true;
    },
    getOwnPropertyDescriptor: (target, key) => {
      if (container.exportsValues.has(key))
        return {
          enumerable: true,
          configurable: true,
        };

      return undefined;
    },
  });
};
