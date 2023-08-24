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
import type { IBaseEntrypoint } from '../types';

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

export function loadAndParse(
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

export const getIdx = (fn: string) =>
  getFileIdx(fn).toString().padStart(5, '0');

export function getStack(entrypoint: IBaseEntrypoint) {
  const stack = [entrypoint.name];

  let { parent } = entrypoint;
  while (parent) {
    stack.push(parent.name);
    parent = parent.parent;
  }

  return stack;
}

export const includes = (a: string[], b: string[]) => {
  if (a.includes('*')) return true;
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
};
