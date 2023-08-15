import { readFileSync } from 'fs';
import { dirname, extname } from 'path';

import type { PluginItem, TransformOptions } from '@babel/core';
import type { File } from '@babel/types';

import type { Debugger } from '@linaria/logger';
import type { Evaluator, StrictOptions } from '@linaria/utils';
import {
  buildOptions,
  getFileIdx,
  getPluginKey,
  loadBabelOptions,
} from '@linaria/utils';

import type { IBaseEntrypoint } from '../../types';
import { getMatchedRule, parseFile } from '../helpers/parseFile';

import type { IEntrypoint, Services, IEntrypointCode } from './types';

const EMPTY_FILE = '=== empty file ===';

const getIdx = (fn: string) => getFileIdx(fn).toString().padStart(5, '0');

const includes = (a: string[], b: string[]) => {
  if (a.includes('*')) return true;
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
};

const isParent = (
  parent: IEntrypoint | { log: Debugger }
): parent is IEntrypoint => 'name' in parent;

export function getStack(entrypoint: IBaseEntrypoint) {
  const stack = [entrypoint.name];

  let { parent } = entrypoint;
  while (parent) {
    stack.push(parent.name);
    parent = parent.parent;
  }

  return stack;
}

const isModuleResolver = (plugin: PluginItem) =>
  getPluginKey(plugin) === 'module-resolver';

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
    // eslint-disable-next-line no-console
    console.warn(
      `[linaria] ${name} has a module-resolver plugin in its babelrc, but it is not present` +
        `in the babelOptions for the linaria plugin. This works for now but will be an error in the future.` +
        `Please add the module-resolver plugin to the babelOptions for the linaria plugin.`
    );

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

function loadAndParse(
  services: Services,
  name: string,
  loadedCode: string | undefined,
  log: Debugger,
  pluginOptions: StrictOptions
) {
  const { babel, cache, eventEmitter } = services;

  const extension = extname(name);

  if (!pluginOptions.extensions.includes(extension)) {
    log(
      '[createEntrypoint] %s is ignored. If you want it to be processed, you should add \'%s\' to the "extensions" option.',
      name,
      extension
    );

    return 'ignored';
  }

  const code = loadedCode ?? readFileSync(name, 'utf-8');

  const { action, babelOptions } = getMatchedRule(
    pluginOptions.rules,
    name,
    code
  );

  if (action === 'ignore') {
    log('[createEntrypoint] %s is ignored by rule', name);
    cache.add('ignored', name, true);
    return 'ignored';
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

  const ast: File = eventEmitter.pair(
    { method: 'parseFile' },
    () =>
      cache.get('originalAST', name) ??
      parseFile(babel, name, code, parseConfig)
  );

  return {
    ast,
    code,
    evaluator,
    evalConfig,
  };
}

const supersedeHandlers = new WeakMap<
  IBaseEntrypoint,
  Array<(newEntrypoint: IEntrypoint<unknown>) => void>
>();

export function onSupersede<T extends IBaseEntrypoint>(
  entrypoint: T,
  callback: (newEntrypoint: T) => void
) {
  if (!supersedeHandlers.has(entrypoint)) {
    supersedeHandlers.set(entrypoint, []);
  }

  const handlers = supersedeHandlers.get(entrypoint)!;
  handlers.push(callback as (newEntrypoint: IBaseEntrypoint) => void);
  supersedeHandlers.set(entrypoint, handlers);

  return () => {
    const index = handlers.indexOf(
      callback as (newEntrypoint: IBaseEntrypoint) => void
    );
    if (index >= 0) {
      handlers.splice(index, 1);
    }
  };
}

export function supersedeEntrypoint<TPluginOptions>(
  services: Pick<Services, 'cache'>,
  oldEntrypoint: IEntrypoint<TPluginOptions>,
  newEntrypoint: IEntrypoint<TPluginOptions>
) {
  // If we already have a result for this file, we should invalidate it
  services.cache.invalidate('eval', oldEntrypoint.name);

  supersedeHandlers
    .get(oldEntrypoint)
    ?.forEach((handler) => handler(newEntrypoint));
}

export type LoadAndParseFn<TServices, TPluginOptions> = (
  services: TServices,
  name: string,
  loadedCode: string | undefined,
  log: Debugger,
  pluginOptions: TPluginOptions
) => IEntrypointCode | 'ignored';

export function genericCreateEntrypoint<
  TServices extends Pick<Services, 'cache' | 'eventEmitter'>,
  TPluginOptions
>(
  loadAndParseFn: LoadAndParseFn<TServices, TPluginOptions>,
  services: TServices,
  parent: IEntrypoint | { log: Debugger },
  name: string,
  only: string[],
  loadedCode: string | undefined,
  pluginOptions: TPluginOptions
): IEntrypoint<TPluginOptions> | 'ignored' {
  const { cache, eventEmitter } = services;

  return eventEmitter.pair({ method: 'createEntrypoint' }, () => {
    if (loadedCode !== undefined) {
      cache.invalidateIfChanged(name, loadedCode);
    }

    const idx = getIdx(name);
    const log = parent.log.extend(idx, isParent(parent) ? '->' : ':');

    let onCreate: (
      newEntrypoint: IEntrypoint<TPluginOptions>
    ) => void = () => {};

    const cached = cache.get('entrypoints', name) as
      | IEntrypoint<TPluginOptions>
      | undefined;
    const mergedOnly = cached?.only
      ? Array.from(new Set([...cached.only, ...only]))
          .filter((i) => i)
          .sort()
      : only;

    if (cached) {
      if (includes(cached.only, mergedOnly)) {
        log('%s is cached', name);
        return cached;
      }

      log(
        '%s is cached, but with different `only` %o (the cached one %o)',
        name,
        only,
        cached?.only
      );

      onCreate = (newEntrypoint) => {
        supersedeEntrypoint(services, cached, newEntrypoint);
      };
    }

    const loadedAndParsed = loadAndParseFn(
      services,
      name,
      loadedCode,
      log,
      pluginOptions
    );

    if (loadedAndParsed === 'ignored') {
      return 'ignored';
    }

    cache.invalidateIfChanged(name, loadedAndParsed.code);
    cache.add('originalAST', name, loadedAndParsed.ast);

    log(
      '[createEntrypoint] %s (%o)\n%s',
      name,
      mergedOnly,
      loadedAndParsed.code || EMPTY_FILE
    );

    const newEntrypoint: IEntrypoint<TPluginOptions> = {
      ...loadedAndParsed,
      idx,
      log,
      name,
      only: mergedOnly,
      parent: isParent(parent) ? parent : null,
      pluginOptions,
    };

    cache.add('entrypoints', name, newEntrypoint);
    onCreate(newEntrypoint);

    return newEntrypoint;
  });
}

export function createEntrypoint(
  services: Services,
  parent: IEntrypoint | { log: Debugger },
  name: string,
  only: string[],
  loadedCode: string | undefined,
  pluginOptions: StrictOptions
): IEntrypoint | 'ignored' {
  return genericCreateEntrypoint(
    loadAndParse,
    services,
    parent,
    name,
    only,
    loadedCode,
    pluginOptions
  );
}
