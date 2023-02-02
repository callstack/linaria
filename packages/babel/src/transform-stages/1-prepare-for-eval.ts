/* eslint-disable no-restricted-syntax,no-continue,no-await-in-loop */
import { readFileSync } from 'fs';
import { dirname, extname } from 'path';

import type { BabelFileResult, TransformOptions } from '@babel/core';

import { createCustomDebug } from '@linaria/logger';
import type { EvalRule, Evaluator } from '@linaria/utils';
import { buildOptions, getFileIdx, loadBabelOptions } from '@linaria/utils';

import type { Core } from '../babel';
import type { TransformCacheCollection } from '../cache';
import type Module from '../module';
import type { ITransformFileResult, Options } from '../types';
import withLinariaMetadata from '../utils/withLinariaMetadata';

import type { IEntrypoint } from './helpers/ModuleQueue';
import { ModuleQueue } from './helpers/ModuleQueue';
import cachedParseSync from './helpers/cachedParseSync';
import loadLinariaOptions from './helpers/loadLinariaOptions';

const isModuleResolver = (i: unknown): i is { options: unknown } =>
  typeof i === 'object' &&
  i !== null &&
  (i as { key?: string }).key === 'module-resolver';

function runPreevalStage(
  babel: Core,
  filename: string,
  code: string,
  options: Pick<Options, 'root' | 'pluginOptions' | 'inputSourceMap'>,
  perFileBabelConfig?: TransformOptions
): BabelFileResult {
  const pluginOptions = loadLinariaOptions(options.pluginOptions);
  const parseConfig = buildOptions(
    pluginOptions?.babelOptions,
    perFileBabelConfig
  );

  const fullParserOptions = loadBabelOptions(babel, filename, parseConfig);
  const file = cachedParseSync(babel, code, fullParserOptions);

  const transformPlugins: babel.PluginItem[] = [
    [require.resolve('../plugins/preeval'), pluginOptions],
  ];

  const moduleResolverPlugin =
    fullParserOptions.plugins?.find(isModuleResolver);
  if (moduleResolverPlugin) {
    transformPlugins.unshift(moduleResolverPlugin);
  }

  const transformConfig = buildOptions({
    envName: 'linaria',
    plugins: transformPlugins,
    sourceMaps: true,
    sourceFileName: filename,
    inputSourceMap: options.inputSourceMap,
    root: options.root,
    ast: true,
    babelrc: false,
    configFile: false,
  });

  const result = babel.transformFromAstSync(file, code, {
    ...transformConfig,
    filename,
  });

  if (!result || !result.ast?.program) {
    throw new Error('Babel transform failed');
  }

  return result;
}

function getMatchedRule(
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

function prepareCode(
  babel: Core,
  filename: string,
  originalCode: string,
  only: string[],
  options: Pick<Options, 'root' | 'pluginOptions' | 'inputSourceMap'>
): [
  code: string,
  imports: Module['imports'],
  metadata?: babel.BabelFileMetadata
] {
  const log = createCustomDebug('transform', getFileIdx(filename));

  const pluginOptions = loadLinariaOptions(options.pluginOptions);

  const { action, babelOptions } = getMatchedRule(
    pluginOptions.rules,
    filename,
    originalCode
  );

  if (action === 'ignore') {
    log('stage-1:ignore', '');

    return [originalCode, null];
  }

  const preevalStageResult = runPreevalStage(
    babel,
    filename,
    originalCode,
    options,
    babelOptions
  );

  if (
    only.length === 1 &&
    only[0] === '__linariaPreval' &&
    !withLinariaMetadata(preevalStageResult.metadata)
  ) {
    log('stage-1:evaluator:end', 'no metadata');
    return [preevalStageResult.code!, null, preevalStageResult.metadata];
  }

  log('stage-1:preeval', 'metadata %O', preevalStageResult.metadata);

  // Action can be a function or a module name
  const evaluator: Evaluator =
    typeof action === 'function'
      ? action
      : require(require.resolve(action, {
          paths: [dirname(filename)],
        })).default;

  log('stage-1:evaluator:start', 'using %s', evaluator.name);

  const result = evaluator(
    filename,
    pluginOptions,
    preevalStageResult.code!,
    only,
    babel
  );

  log('stage-1:evaluator:end', '');

  return [...result, preevalStageResult.metadata];
}

function processQueueItem(
  babel: Core,
  item: {
    name: string;
    code: string;
    only: string[];
  } | null,
  cache: TransformCacheCollection,
  options: Pick<Options, 'root' | 'pluginOptions' | 'inputSourceMap'>
):
  | {
      imports: Map<string, string[]> | null;
      name: string;
      result: ITransformFileResult;
    }
  | undefined {
  if (!item) {
    return undefined;
  }

  const pluginOptions = loadLinariaOptions(options.pluginOptions);
  const { name, only, code } = item;
  const onlyAsStr = only.join(', ');
  const log = createCustomDebug('transform', getFileIdx(name));
  const extension = extname(name);

  if (!pluginOptions.extensions.includes(extension)) {
    log(
      'init',
      `${name} is ignored. If you want it to be processed, you should add '${extension}' to the "extensions" option.`
    );
    return undefined;
  }

  log('init', `${name} (${onlyAsStr})\n${code}`);

  log('stage-1', `>> (${onlyAsStr})`);

  const [preparedCode, imports, metadata] = prepareCode(
    babel,
    name,
    code,
    only,
    options
  );

  if (code === preparedCode) {
    log('stage-1', `<< (${onlyAsStr})\n === no changes ===`);
  } else {
    log('stage-1', `<< (${onlyAsStr})\n${preparedCode}`);
  }

  if (preparedCode === '') return undefined;

  return {
    imports,
    name,
    result: {
      metadata,
      code: preparedCode,
    },
  };
}

const isEqual = ([...a]: string[], [...b]: string[]) => {
  if (a.includes('*')) return true;
  if (a.length !== b.length) return false;
  a.sort();
  b.sort();
  return a.every((item, index) => item === b[index]);
};

export function prepareForEvalSync(
  babel: Core,
  cache: TransformCacheCollection,
  resolve: (what: string, importer: string, stack: string[]) => string,
  entrypoint: IEntrypoint,
  options: Pick<Options, 'root' | 'pluginOptions' | 'inputSourceMap'>
): ITransformFileResult | undefined {
  const queue = new ModuleQueue(entrypoint);

  while (!queue.isEmpty()) {
    const [nextItem, resolveStack] = queue.dequeue() ?? [];
    if (!nextItem || !resolveStack) {
      continue;
    }

    const { name, only, code } = nextItem;
    const log = createCustomDebug('transform', getFileIdx(name));

    const cached = cache.codeCache.get(name);
    // If we already have a result for this file, we should get a result for merged `only`
    const mergedOnly = cached?.only
      ? Array.from(new Set([...cached.only, ...only]))
      : only;

    if (cached && isEqual(cached.only, mergedOnly)) {
      log('stage-1', '%s is already processed', name);
      continue;
    }

    const processed = processQueueItem(
      babel,
      {
        name,
        code,
        only: mergedOnly,
      },
      cache,
      options
    );

    if (!processed) continue;

    const { imports, result } = processed;

    for (const [importedFile, importsOnly] of imports ?? []) {
      try {
        const resolved = resolve(importedFile, name, resolveStack);
        log('stage-1:sync-resolve', `✅ ${importedFile} -> ${resolved}`);
        cache.resolveCache.set(
          `${name} -> ${importedFile}`,
          `${resolved}\0${importsOnly.join(',')}`
        );
        const fileContent = readFileSync(resolved, 'utf8');
        queue.enqueue([
          {
            name: resolved,
            only: importsOnly,
            code: fileContent,
          },
          [name, ...resolveStack],
        ]);
      } catch (err) {
        log(
          'stage-1:sync-resolve',
          `❌ cannot resolve ${importedFile}: %O`,
          err
        );
      }
    }

    cache.codeCache.set(name, {
      imports,
      only: mergedOnly,
      result,
    });
  }

  return cache.codeCache.get(entrypoint.name)?.result;
}

/**
 * Parses the specified file and recursively all its dependencies,
 * finds tags, applies eval-time replacements, removes dead code.
 */
export default async function prepareForEval(
  babel: Core,
  cache: TransformCacheCollection,
  resolve: (
    what: string,
    importer: string,
    stack: string[]
  ) => Promise<string | null>,
  entrypoint: IEntrypoint,
  options: Pick<Options, 'root' | 'pluginOptions' | 'inputSourceMap'>
): Promise<ITransformFileResult | undefined> {
  /*
   * This method can be run simultaneously for multiple files.
   * A shared cache is accessible for all runs, but each run has its own queue
   * to maintain the correct processing order. The cache stores the outcome
   * of tree-shaking, and if the result is already stored in the cache
   * but the "only" option has changed, the file will be re-processed using
   * the combined "only" option.
   */
  const log = createCustomDebug('transform', getFileIdx(entrypoint.name));

  const queue = new ModuleQueue(entrypoint);

  while (!queue.isEmpty()) {
    const [nextItem, resolveStack] = queue.dequeue() ?? [];
    if (!nextItem || !resolveStack) {
      continue;
    }

    const { name, only, code } = nextItem;

    const cached = cache.codeCache.get(name);
    // If we already have a result for this file, we should get a result for merged `only`
    const mergedOnly = cached?.only
      ? Array.from(new Set([...cached.only, ...only]))
      : only;

    let imports: Map<string, string[]> | null = null;
    let result: ITransformFileResult | undefined;

    if (cached) {
      if (isEqual(cached.only, mergedOnly)) {
        log('stage-1', '%s is already processed', name);
        imports = cached.imports;
        result = cached.result;
      } else {
        log(
          'stage-1',
          '%s is already processed, but with different `only` %o (the cached one %o)',
          name,
          only,
          cached?.only
        );

        // If we already have a result for this file, we should invalidate it
        cache.evalCache.delete(name);
      }
    }

    if (!result) {
      const processed = processQueueItem(
        babel,
        {
          name,
          code,
          only: mergedOnly,
        },
        cache,
        options
      );

      if (!processed) {
        log('stage-1', '%s is skipped', name);
        continue;
      }

      imports = processed.imports;
      result = processed.result;
    }

    if (imports) {
      for (const [importedFile, importsOnly] of imports) {
        let resolved: string | null = null;
        try {
          resolved = await resolve(importedFile, name, resolveStack);
        } catch (err) {
          log(
            'stage-1:async-resolve',
            `❌ cannot resolve %s in %s: %O`,
            importedFile,
            name,
            err
          );
        }

        if (resolved === null) {
          log('stage-1:resolve', `✅ %s in %s is ignored`, importedFile, name);
          continue;
        }

        log(
          'stage-1:async-resolve',
          `✅ %s (%o) in %s -> %s`,
          importedFile,
          importsOnly,
          name,
          resolved
        );

        const resolveCacheKey = `${name} -> ${importedFile}`;
        const resolveCached = cache.resolveCache.get(resolveCacheKey);
        const importsOnlySet = new Set(importsOnly);
        if (resolveCached) {
          const [, cachedOnly] = resolveCached.split('\0');
          cachedOnly?.split(',').forEach((token) => {
            importsOnlySet.add(token);
          });
        }

        cache.resolveCache.set(
          resolveCacheKey,
          `${resolved}\0${[...importsOnlySet].join(',')}`
        );

        const fileContent = readFileSync(resolved, 'utf8');
        queue.enqueue([
          {
            name: resolved,
            only: importsOnly,
            code: fileContent,
          },
          [name, ...resolveStack],
        ]);
      }
    } else {
      log('stage-1', '%s has no imports', name);
    }

    cache.codeCache.set(name, {
      imports,
      only: mergedOnly,
      result,
    });
  }

  log('stage-1', 'queue is empty, %s is ready', entrypoint.name);

  return cache.codeCache.get(entrypoint.name)?.result;
}
