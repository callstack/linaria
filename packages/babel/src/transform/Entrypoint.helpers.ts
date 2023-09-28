import { readFileSync } from 'fs';
import { dirname, extname, isAbsolute } from 'path';

import type { TransformOptions, PluginItem } from '@babel/core';
import type { File } from '@babel/types';

import type { Debugger } from '@linaria/logger';
import { createCustomDebug } from '@linaria/logger';
import type { EvalRule, Evaluator, StrictOptions } from '@linaria/utils';
import {
  buildOptions,
  getFileIdx,
  getPluginKey,
  isFeatureEnabled,
  loadBabelOptions,
} from '@linaria/utils';

import type { Core } from '../babel';
import type { ParentEntrypoint } from '../types';

import type { IEntrypointCode, IIgnoredEntrypoint } from './Entrypoint.types';
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

  const useBabelConfigs = isFeatureEnabled(
    pluginOptions.features,
    'useBabelConfigs',
    name
  );

  if (!useBabelConfigs) {
    rawConfig.configFile = false;
  }

  const parseConfig = loadBabelOptions(babel, name, {
    babelrc: useBabelConfigs,
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
  log: Debugger
): IEntrypointCode | IIgnoredEntrypoint {
  const {
    babel,
    eventEmitter,
    options: { pluginOptions },
  } = services;

  const extension = extname(name);

  if (!pluginOptions.extensions.includes(extension)) {
    log(
      '[createEntrypoint] %s is ignored. If you want it to be processed, you should add \'%s\' to the "extensions" option.',
      name,
      extension
    );

    return {
      get code() {
        if (isAbsolute(name)) {
          return loadedCode ?? readFileSync(name, 'utf-8');
        }

        return ''; // it is a built-in module
      },
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

  let ast: File | undefined;

  const { evalConfig, parseConfig } = buildConfigs(
    services,
    name,
    pluginOptions,
    babelOptions
  );

  const getOrParse = () => {
    if (ast) return ast;
    ast = eventEmitter.perf('parseFile', () =>
      parseFile(babel, name, code, parseConfig)
    );

    return ast;
  };

  if (action === 'ignore') {
    log('[createEntrypoint] %s is ignored by rule', name);
    return {
      get ast() {
        return getOrParse();
      },
      code,
      evaluator: 'ignored',
      reason: 'rule',
    };
  }

  const evaluator: Evaluator =
    typeof action === 'function'
      ? action
      : require(
          require.resolve(action, {
            paths: [dirname(name)],
          })
        ).default;

  return {
    get ast() {
      return getOrParse();
    },
    code,
    evaluator,
    evalConfig,
  };
}

export function getStack(entrypoint: ParentEntrypoint) {
  if (!entrypoint) return [];

  const stack = [entrypoint.name];

  let { parents } = entrypoint;
  while (parents.length) {
    stack.push(parents[0].name);
    parents = parents[0].parents;
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
