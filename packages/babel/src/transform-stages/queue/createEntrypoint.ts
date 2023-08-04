import { readFileSync } from 'fs';
import { dirname, extname } from 'path';

import type { PluginItem } from '@babel/core';
import type { File } from '@babel/types';

import type { Debugger } from '@linaria/logger';
import type { Evaluator, EventEmitter, StrictOptions } from '@linaria/utils';
import {
  buildOptions,
  getFileIdx,
  getPluginKey,
  loadBabelOptions,
} from '@linaria/utils';

import type { Core } from '../../babel';
import type { TransformCacheCollection } from '../../cache';
import type { Options } from '../../types';
import { getMatchedRule, parseFile } from '../helpers/parseFile';

import { rootLog } from './rootLog';
import type { IEntrypoint } from './types';

const EMPTY_FILE = '=== empty file ===';

const getLogIdx = (filename: string) =>
  getFileIdx(filename).toString().padStart(5, '0');

export function createEntrypoint(
  babel: Core,
  parentLog: Debugger,
  cache: TransformCacheCollection,
  name: string,
  only: string[],
  maybeCode: string | undefined,
  pluginOptions: StrictOptions,
  options: Pick<Options, 'root' | 'inputSourceMap'>,
  eventEmitter: EventEmitter
): IEntrypoint | 'ignored' {
  const finishEvent = eventEmitter.pair({ method: 'createEntrypoint' });

  const log = parentLog.extend(
    getLogIdx(name),
    parentLog === rootLog ? ':' : '->'
  );
  const extension = extname(name);

  if (!pluginOptions.extensions.includes(extension)) {
    log(
      '[createEntrypoint] %s is ignored. If you want it to be processed, you should add \'%s\' to the "extensions" option.',
      name,
      extension
    );

    finishEvent();
    return 'ignored';
  }

  const code = maybeCode ?? readFileSync(name, 'utf-8');

  const { action, babelOptions } = getMatchedRule(
    pluginOptions.rules,
    name,
    code
  );

  if (action === 'ignore') {
    log('[createEntrypoint] %s is ignored by rule', name);
    cache.add('ignored', name, true);
    finishEvent();
    return 'ignored';
  }

  const evaluator: Evaluator =
    typeof action === 'function'
      ? action
      : require(require.resolve(action, {
          paths: [dirname(name)],
        })).default;

  // FIXME: All those configs should be memoized

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

  const isModuleResolver = (plugin: PluginItem) =>
    getPluginKey(plugin) === 'module-resolver';
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

  cache.invalidateIfChanged(name, code);

  const evalConfig = loadBabelOptions(babel, name, {
    babelrc: false,
    ...rawConfig,
  });

  const onParseFinished = eventEmitter.pair({ method: 'parseFile' });
  const ast: File =
    cache.get('originalAST', name) ?? parseFile(babel, name, code, parseConfig);
  onParseFinished();

  cache.add('originalAST', name, ast);

  log('[createEntrypoint] %s (%o)\n%s', name, only, code || EMPTY_FILE);

  finishEvent();
  return {
    ast,
    code,
    evalConfig,
    evaluator,
    log,
    name,
    only: [...only].filter((i) => i).sort(),
    pluginOptions,
  };
}
