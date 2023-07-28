/* eslint-disable no-restricted-syntax,no-continue,no-await-in-loop */
import { readFileSync } from 'fs';
import { dirname, extname } from 'path';

import type {
  BabelFileMetadata,
  BabelFileResult,
  PluginItem,
} from '@babel/core';
import type { File } from '@babel/types';

import type { Debugger } from '@linaria/logger';
import { linariaLogger } from '@linaria/logger';
import type { Evaluator, EvaluatorConfig, StrictOptions } from '@linaria/utils';
import {
  buildOptions,
  EventEmitter,
  getFileIdx,
  getPluginKey,
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

const rootLog = linariaLogger.extend('transform');

const getLogIdx = (filename: string) =>
  getFileIdx(filename).toString().padStart(5, '0');

function runPreevalStage(
  babel: Core,
  item: IEntrypoint,
  originalAst: File,
  eventEmitter: EventEmitter
): BabelFileResult {
  const { pluginOptions, evalConfig } = item;

  const preShakePlugins =
    evalConfig.plugins?.filter((i) =>
      hasKeyInList(i, pluginOptions.highPriorityPlugins)
    ) ?? [];

  const plugins = [
    ...preShakePlugins,
    [require.resolve('../plugins/preeval'), { ...pluginOptions, eventEmitter }],
    ...(evalConfig.plugins ?? []).filter(
      (i) => !hasKeyInList(i, pluginOptions.highPriorityPlugins)
    ),
  ];

  const transformConfig = buildOptions({
    ...evalConfig,
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
  eventEmitter: EventEmitter
): [code: string, imports: Module['imports'], metadata?: BabelFileMetadata] {
  const { evaluator, log, evalConfig, pluginOptions, only } = item;

  const onPreevalFinished = eventEmitter.pair({ method: 'preeval' });
  const preevalStageResult = runPreevalStage(
    babel,
    item,
    originalAst,
    eventEmitter
  );
  onPreevalFinished();

  if (
    only.length === 1 &&
    only[0] === '__linariaPreval' &&
    !withLinariaMetadata(preevalStageResult.metadata)
  ) {
    log('[evaluator:end] no metadata');
    return [preevalStageResult.code!, null, preevalStageResult.metadata];
  }

  log('[preeval] metadata %O', preevalStageResult.metadata);
  log('[evaluator:start] using %s', evaluator.name);

  const evaluatorConfig: EvaluatorConfig = {
    onlyExports: only,
    highPriorityPlugins: pluginOptions.highPriorityPlugins,
    features: pluginOptions.features,
  };

  const onEvaluatorFinished = eventEmitter.pair({ method: 'evaluator' });
  const [, code, imports] = evaluator(
    evalConfig,
    preevalStageResult.ast!,
    preevalStageResult.code!,
    evaluatorConfig,
    babel
  );
  onEvaluatorFinished();

  log('[evaluator:end]');

  return [code, imports, preevalStageResult.metadata];
}

const EMPTY_FILE = '=== empty file ===';

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

  const { parseConfig, name, only, code, log } = item;

  const onParseFinished = eventEmitter.pair({ method: 'parseFile' });
  const ast: File =
    cache.get('originalAST', name) ?? parseFile(babel, name, code, parseConfig);
  onParseFinished();

  cache.add('originalAST', name, ast);

  log('>> (%o)', only);

  const [preparedCode, imports, metadata] = prepareCode(
    babel,
    item,
    ast,
    eventEmitter
  );

  if (code === preparedCode) {
    log('<< (%o)\n === no changes ===', only);
  } else {
    log('<< (%o)\n%s', only, preparedCode || EMPTY_FILE);
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

const mergeImports = (a: string[], b: string[]) => {
  const result = new Set(a);
  b.forEach((item) => result.add(item));
  return [...result].sort();
};

export function createEntrypoint(
  babel: Core,
  parentLog: Debugger,
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

  const evalConfig = loadBabelOptions(babel, name, {
    babelrc: false,
    ...rawConfig,
  });

  log('[createEntrypoint] %s (%o)\n%s', name, only, code || EMPTY_FILE);

  finishEvent();
  return {
    code,
    evalConfig,
    evaluator,
    log,
    name,
    only,
    parseConfig,
    pluginOptions,
  };
}

function processImports(
  babel: Core,
  log: Debugger,
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
        `[resolve] ✅ %s in %s is ignored`,
        importedFile,
        parent.entrypoint.name
      );
      continue;
    }

    const resolveCacheKey = `${parent.entrypoint.name} -> ${importedFile}`;
    const resolveCached = cache.get('resolve', resolveCacheKey);
    const importsOnlySet = new Set(importsOnly);
    if (resolveCached) {
      const [, cachedOnly] = resolveCached.split('\0');
      cachedOnly?.split(',').forEach((token) => {
        importsOnlySet.add(token);
      });
    }

    cache.add(
      'resolve',
      resolveCacheKey,
      `${resolved}\0${[...importsOnlySet].join(',')}`
    );

    const next = createEntrypoint(
      babel,
      log,
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
  const { code, name, only, log } = nextItem.entrypoint;
  log(
    'start processing %s (only: %s, refs: %d)',
    name,
    only,
    nextItem.refCount ?? 0
  );

  cache.invalidateIfChanged(name, code);

  const cached = cache.get('code', name);
  // If we already have a result for this file, we should get a result for merged `only`
  const mergedOnly = cached?.only
    ? Array.from(new Set([...cached.only, ...only]))
    : only;

  let imports: Map<string, string[]> | null = null;
  let result: ITransformFileResult | undefined;

  if (cached) {
    if (isEqual(cached.only, mergedOnly)) {
      log('%s is already processed', name);
      if (!nextItem.stack.includes(nextItem.entrypoint.name)) {
        imports = cached.imports;
      }

      result = cached.result;
    } else {
      log(
        '%s is already processed, but with different `only` %o (the cached one %o)',
        name,
        only,
        cached?.only
      );

      // If we already have a result for this file, we should invalidate it
      cache.invalidate('eval', name);
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
      log('%s is skipped', name);
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
  const entrypoint = createEntrypoint(
    babel,
    rootLog,
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
    const { log } = item.entrypoint;

    if (listOfImports.length > 0) {
      const onResolveFinished = eventEmitter.pair({ method: 'resolve' });
      const resolvedImports = listOfImports.map(
        ([importedFile, importsOnly]) => {
          let resolved: string | null = null;
          try {
            resolved = resolve(importedFile, item.entrypoint.name, item.stack);
            log(
              '[sync-resolve] ✅ %s -> %s (only: %o)',
              importedFile,
              resolved,
              importsOnly
            );
          } catch (err) {
            log('[sync-resolve] ❌ cannot resolve %s: %O', importedFile, err);
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

      log('%s has no imports', item.entrypoint.name);
    }

    cache.add('code', item.entrypoint.name, {
      imports,
      only: mergedOnly,
      result,
    });
  }

  return cache.get('code', entrypoint.name)?.result;
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
  const entrypoint = createEntrypoint(
    babel,
    rootLog,
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
    const { log } = item.entrypoint;

    const listOfImports = Array.from(imports?.entries() ?? []);
    if (listOfImports.length > 0) {
      const onResolveFinished = eventEmitter.pair({ method: 'resolve' });
      log('resolving %d imports', listOfImports.length);

      const getResolveTask = async (
        importedFile: string,
        importsOnly: string[]
      ) => {
        let resolved: string | null = null;
        try {
          resolved = await resolve(
            importedFile,
            item.entrypoint.name,
            item.stack
          );
        } catch (err) {
          log(
            '[async-resolve] ❌ cannot resolve %s in %s: %O',
            importedFile,
            item.entrypoint.name,
            err
          );
        }

        if (resolved !== null) {
          log(
            '[async-resolve] ✅ %s (%o) in %s -> %s',
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
      };

      const resolvedImports = await Promise.all(
        listOfImports.map(([importedFile, importsOnly]) => {
          const resolveCacheKey = `${item.entrypoint.name} -> ${importedFile}`;

          const cached = cache.get('resolve', resolveCacheKey);
          if (cached) {
            const [cachedResolved, cachedOnly] = cached.split('\0');
            return {
              importedFile,
              importsOnly: mergeImports(importsOnly, cachedOnly.split(',')),
              resolved: cachedResolved,
            };
          }

          const cachedTask = cache.get('resolveTask', resolveCacheKey);
          if (cachedTask) {
            // If we have cached task, we need to merge importsOnly…
            const newTask = cachedTask.then((res) => {
              if (isEqual(res.importsOnly, importsOnly)) {
                return res;
              }

              const merged = mergeImports(res.importsOnly, importsOnly);

              log(
                'merging imports %o and %o: %o',
                importsOnly,
                res.importsOnly,
                merged
              );

              cache.add(
                'resolve',
                resolveCacheKey,
                `${res.resolved}\0${merged.join(',')}`
              );

              return { ...res, importsOnly: merged };
            });

            // … and update the cache
            cache.add('resolveTask', resolveCacheKey, newTask);
            return newTask;
          }

          const resolveTask = getResolveTask(importedFile, importsOnly).then(
            (res) => {
              cache.add(
                'resolve',
                resolveCacheKey,
                `${res.resolved}\0${importsOnly.join(',')}`
              );

              return res;
            }
          );

          cache.add('resolveTask', resolveCacheKey, resolveTask);

          return resolveTask;
        })
      );
      onResolveFinished();
      log('resolved %d imports', resolvedImports.length);

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

      log('%s has no imports', item.entrypoint.name);
    }

    cache.add('code', item.entrypoint.name, {
      imports,
      only: mergedOnly,
      result,
    });
  }

  entrypoint.log('queue is empty, %s is ready', entrypoint.name);

  return cache.get('code', entrypoint.name)?.result;
}
