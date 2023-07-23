/* eslint-disable no-restricted-syntax,no-continue,no-await-in-loop */
import { readFileSync } from 'fs';
import { dirname, extname } from 'path';

import type {
  BabelFileMetadata,
  BabelFileResult,
  PluginItem,
} from '@babel/core';
import type { File } from '@babel/types';

import type { CustomDebug } from '@linaria/logger';
import { createCustomDebug } from '@linaria/logger';
import type { Evaluator, EvaluatorConfig, StrictOptions } from '@linaria/utils';
import {
  buildOptions,
  EventEmitter,
  getFileIdx,
  loadBabelOptions,
} from '@linaria/utils';

import type { Core } from '../babel';
import type { TransformCacheCollection } from '../cache';
import type Module from '../module';
import type { ITransformFileResult, Options } from '../types';
import withLinariaMetadata from '../utils/withLinariaMetadata';

import type { IEntrypoint, NextItem } from './helpers/ModuleQueue';
import { ModuleQueue } from './helpers/ModuleQueue';
import { getMatchedRule, parseFile } from './helpers/parseFile';

const getKey = (plugin: PluginItem): string | null => {
  if (typeof plugin === 'string') {
    return plugin;
  }

  if (Array.isArray(plugin)) {
    return getKey(plugin[0]);
  }

  if (typeof plugin === 'object' && plugin !== null && 'key' in plugin) {
    return (plugin as { key?: string | null }).key ?? null;
  }

  return null;
};

const hasKeyInList = (plugin: PluginItem, list: string[]): boolean => {
  const pluginKey = getKey(plugin);
  return pluginKey ? list.some((i) => pluginKey.includes(i)) : false;
};

function runPreevalStage(
  babel: Core,
  item: IEntrypoint,
  originalAst: File,
  pluginOptions: StrictOptions,
  eventEmitter: EventEmitter
): BabelFileResult {
  const babelOptions = item.parseConfig;

  const preShakePlugins =
    babelOptions.plugins?.filter((i) =>
      hasKeyInList(i, pluginOptions.highPriorityPlugins)
    ) ?? [];

  const plugins = [
    ...preShakePlugins,
    [require.resolve('../plugins/preeval'), { ...pluginOptions, eventEmitter }],
    ...(babelOptions.plugins ?? []).filter(
      (i) => !hasKeyInList(i, pluginOptions.highPriorityPlugins)
    ),
  ];

  const transformConfig = buildOptions({
    ...babelOptions,
    envName: 'linaria',
    plugins,
  });

  const result = babel.transformFromAstSync(
    originalAst,
    item.code,
    transformConfig
  );

  if (!result || !result.ast?.program) {
    throw new Error('Babel transform failed');
  }

  return result;
}

export function prepareCode(
  babel: Core,
  item: IEntrypoint,
  originalAst: File,
  pluginOptions: StrictOptions,
  eventEmitter: EventEmitter
): [code: string, imports: Module['imports'], metadata?: BabelFileMetadata] {
  const { evaluator, name: filename, parseConfig, only } = item;

  const log = createCustomDebug('transform', getFileIdx(filename));

  const onPreevalFinished = eventEmitter.pair({ method: 'preeval' });
  const preevalStageResult = runPreevalStage(
    babel,
    item,
    originalAst,
    pluginOptions,
    eventEmitter
  );
  onPreevalFinished();

  if (
    only.length === 1 &&
    only[0] === '__linariaPreval' &&
    !withLinariaMetadata(preevalStageResult.metadata)
  ) {
    log('stage-1:evaluator:end', 'no metadata');
    return [preevalStageResult.code!, null, preevalStageResult.metadata];
  }

  log('stage-1:preeval', 'metadata %O', preevalStageResult.metadata);
  log('stage-1:evaluator:start', 'using %s', evaluator.name);

  const evaluatorConfig: EvaluatorConfig = {
    onlyExports: only,
    highPriorityPlugins: pluginOptions.highPriorityPlugins,
    features: pluginOptions.features,
  };

  const onEvaluatorFinished = eventEmitter.pair({ method: 'evaluator' });
  const [, code, imports] = evaluator(
    parseConfig,
    preevalStageResult.ast!,
    preevalStageResult.code!,
    evaluatorConfig,
    babel
  );
  onEvaluatorFinished();

  log('stage-1:evaluator:end', '');

  return [code, imports, preevalStageResult.metadata];
}

function processQueueItem(
  babel: Core,
  item: IEntrypoint | null,
  cache: TransformCacheCollection,
  pluginOptions: StrictOptions,
  eventEmitter: EventEmitter
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

  const { parseConfig, name, only, code } = item;

  const onParseFinished = eventEmitter.pair({ method: 'parseFile' });
  const ast: File =
    cache.originalASTCache.get(name) ??
    parseFile(babel, name, code, parseConfig);
  onParseFinished();

  const log = createCustomDebug('transform', getFileIdx(name));

  cache.originalASTCache.set(name, ast);

  const onlyAsStr = only.join(', ');
  log('stage-1', `>> (${onlyAsStr})`);

  const [preparedCode, imports, metadata] = prepareCode(
    babel,
    item,
    ast,
    pluginOptions,
    eventEmitter
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
      code: preparedCode,
      metadata,
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

export function createEntrypoint(
  babel: Core,
  name: string,
  only: string[],
  maybeCode: string | undefined,
  pluginOptions: StrictOptions,
  options: Pick<Options, 'root' | 'inputSourceMap'>,
  eventEmitter: EventEmitter
): IEntrypoint | 'ignored' {
  const finishEvent = eventEmitter.pair({ method: 'createEntrypoint' });

  const log = createCustomDebug('transform', getFileIdx(name));
  const extension = extname(name);

  if (!pluginOptions.extensions.includes(extension)) {
    log(
      'createEntrypoint',
      `${name} is ignored. If you want it to be processed, you should add '${extension}' to the "extensions" option.`
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
    log('createEntrypoint', `${name} is ignored by rule`);
    finishEvent();
    return 'ignored';
  }

  const evaluator: Evaluator =
    typeof action === 'function'
      ? action
      : require(require.resolve(action, {
          paths: [dirname(name)],
        })).default;

  const parseConfig = buildOptions(pluginOptions?.babelOptions, babelOptions, {
    ast: true,
    filename: name,
    inputSourceMap: options.inputSourceMap,
    root: options.root,
    sourceFileName: name,
    sourceMaps: true,
  });

  const fullParserOptions = loadBabelOptions(babel, name, parseConfig);

  log('createEntrypoint', `${name} (${only.join(', ')})\n${code}`);

  finishEvent();
  return {
    code,
    evaluator,
    name,
    only,
    parseConfig: fullParserOptions,
  };
}

function processImports(
  babel: Core,
  log: CustomDebug,
  cache: TransformCacheCollection,
  queue: ModuleQueue,
  pluginOptions: StrictOptions,
  options: Pick<Options, 'root' | 'inputSourceMap'>,
  parent: NextItem,
  resolvedImports: {
    importsOnly: string[];
    importedFile: string;
    resolved: string | null;
  }[],
  eventEmitter: EventEmitter
) {
  for (const { importedFile, importsOnly, resolved } of resolvedImports) {
    if (resolved === null) {
      log(
        'stage-1:resolve',
        `✅ %s in %s is ignored`,
        importedFile,
        parent.entrypoint.name
      );
      continue;
    }

    const resolveCacheKey = `${parent.entrypoint.name} -> ${importedFile}`;
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

    const next = createEntrypoint(
      babel,
      resolved,
      [...importsOnlySet],
      undefined,
      pluginOptions,
      options,
      eventEmitter
    );
    if (next === 'ignored') {
      continue;
    }

    queue.enqueue([next, [parent.entrypoint.name, ...parent.stack]]);
  }
}

// FIXME: naming
function processEntrypoint(
  babel: Core,
  log: CustomDebug,
  cache: TransformCacheCollection,
  pluginOptions: StrictOptions,
  options: Pick<Options, 'root' | 'inputSourceMap'>,
  nextItem: NextItem,
  eventEmitter: EventEmitter
):
  | {
      imports: Map<string, string[]> | null;
      result: ITransformFileResult;
      only: string[];
    }
  | 'skip' {
  const { code, name, only } = nextItem.entrypoint;

  cache.invalidateIfChanged(name, code);

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
      if (!nextItem.stack.includes(nextItem.entrypoint.name)) {
        imports = cached.imports;
      }

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
        ...nextItem.entrypoint,
        only: mergedOnly,
      },
      cache,
      pluginOptions,
      eventEmitter
    );

    if (!processed) {
      log('stage-1', '%s is skipped', name);
      return 'skip';
    }

    imports = processed.imports;
    result = processed.result;
  }

  return {
    imports,
    result,
    only: mergedOnly,
  };
}

export function prepareForEvalSync(
  babel: Core,
  cache: TransformCacheCollection,
  resolve: (what: string, importer: string, stack: string[]) => string,
  partialEntrypoint: Pick<IEntrypoint, 'code' | 'name' | 'only'>,
  pluginOptions: StrictOptions,
  options: Pick<Options, 'root' | 'inputSourceMap'>,
  eventEmitter = EventEmitter.dummy
): ITransformFileResult | undefined {
  const log = createCustomDebug(
    'transform',
    getFileIdx(partialEntrypoint.name)
  );

  const entrypoint = createEntrypoint(
    babel,
    partialEntrypoint.name,
    partialEntrypoint.only,
    partialEntrypoint.code,
    pluginOptions,
    options,
    eventEmitter
  );

  if (entrypoint === 'ignored') {
    return undefined;
  }

  const queue = new ModuleQueue(entrypoint);

  while (!queue.isEmpty()) {
    const item = queue.dequeue();
    if (!item) {
      continue;
    }

    const processResult = processEntrypoint(
      babel,
      log,
      cache,
      pluginOptions,
      options,
      item,
      eventEmitter
    );
    if (processResult === 'skip') {
      continue;
    }

    const { imports, result, only: mergedOnly } = processResult;
    const listOfImports = Array.from(imports?.entries() ?? []);

    if (listOfImports.length > 0) {
      const onResolveFinished = eventEmitter.pair({ method: 'resolve' });
      const resolvedImports = listOfImports.map(
        ([importedFile, importsOnly]) => {
          let resolved: string | null = null;
          try {
            resolved = resolve(importedFile, item.entrypoint.name, item.stack);
            log(
              'stage-1:sync-resolve',
              `✅ ${importedFile} -> ${resolved} (only: %o)`,
              importsOnly
            );
          } catch (err) {
            log(
              'stage-1:sync-resolve',
              `❌ cannot resolve ${importedFile}: %O`,
              err
            );
          }

          return {
            importedFile,
            importsOnly,
            resolved,
          };
        }
      );
      onResolveFinished();

      eventEmitter.single({
        type: 'dependency',
        file: item.entrypoint.name,
        only: item.entrypoint.only,
        imports: resolvedImports.map(({ resolved, importsOnly }) => ({
          from: resolved,
          what: importsOnly,
        })),
      });

      processImports(
        babel,
        log,
        cache,
        queue,
        pluginOptions,
        options,
        item,
        resolvedImports,
        eventEmitter
      );
    } else {
      eventEmitter.single({
        type: 'dependency',
        file: item.entrypoint.name,
        only: item.entrypoint.only,
        imports: [],
      });

      log('stage-1', '%s has no imports', item.entrypoint.name);
    }

    cache.codeCache.set(item.entrypoint.name, {
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
  partialEntrypoint: Pick<IEntrypoint, 'code' | 'name' | 'only'>,
  pluginOptions: StrictOptions,
  options: Pick<Options, 'root' | 'inputSourceMap'>,
  eventEmitter = EventEmitter.dummy
): Promise<ITransformFileResult | undefined> {
  /*
   * This method can be run simultaneously for multiple files.
   * A shared cache is accessible for all runs, but each run has its own queue
   * to maintain the correct processing order. The cache stores the outcome
   * of tree-shaking, and if the result is already stored in the cache
   * but the "only" option has changed, the file will be re-processed using
   * the combined "only" option.
   */
  const log = createCustomDebug(
    'transform',
    getFileIdx(partialEntrypoint.name)
  );

  const entrypoint = createEntrypoint(
    babel,
    partialEntrypoint.name,
    partialEntrypoint.only,
    partialEntrypoint.code,
    pluginOptions,
    options,
    eventEmitter
  );

  if (entrypoint === 'ignored') {
    return undefined;
  }

  const queue = new ModuleQueue(entrypoint);

  while (!queue.isEmpty()) {
    const item = queue.dequeue();
    if (!item) {
      continue;
    }

    const processResult = processEntrypoint(
      babel,
      log,
      cache,
      pluginOptions,
      options,
      item,
      eventEmitter
    );
    if (processResult === 'skip') {
      continue;
    }

    const { imports, result, only: mergedOnly } = processResult;

    const listOfImports = Array.from(imports?.entries() ?? []);
    if (listOfImports.length > 0) {
      const onResolveFinished = eventEmitter.pair({ method: 'resolve' });
      const resolvedImports = await Promise.all(
        listOfImports.map(async ([importedFile, importsOnly]) => {
          let resolved: string | null = null;
          try {
            resolved = await resolve(
              importedFile,
              item.entrypoint.name,
              item.stack
            );
          } catch (err) {
            log(
              'stage-1:async-resolve',
              `❌ cannot resolve %s in %s: %O`,
              importedFile,
              item.entrypoint.name,
              err
            );
          }

          if (resolved !== null) {
            log(
              'stage-1:async-resolve',
              `✅ %s (%o) in %s -> %s`,
              importedFile,
              importsOnly,
              item.entrypoint.name,
              resolved
            );
          }

          return {
            importedFile,
            importsOnly,
            resolved,
          };
        })
      );
      onResolveFinished();

      eventEmitter.single({
        type: 'dependency',
        file: item.entrypoint.name,
        only: item.entrypoint.only,
        imports: resolvedImports.map(({ resolved, importsOnly }) => ({
          from: resolved,
          what: importsOnly,
        })),
      });

      processImports(
        babel,
        log,
        cache,
        queue,
        pluginOptions,
        options,
        item,
        resolvedImports,
        eventEmitter
      );
    } else {
      eventEmitter.single({
        type: 'dependency',
        file: item.entrypoint.name,
        only: item.entrypoint.only,
        imports: [],
      });

      log('stage-1', '%s has no imports', item.entrypoint.name);
    }

    cache.codeCache.set(item.entrypoint.name, {
      imports,
      only: mergedOnly,
      result,
    });
  }

  log('stage-1', 'queue is empty, %s is ready', entrypoint.name);

  return cache.codeCache.get(entrypoint.name)?.result;
}
