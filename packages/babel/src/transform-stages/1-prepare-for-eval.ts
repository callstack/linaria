/* eslint-disable no-restricted-syntax,no-continue,no-await-in-loop */
import { readFileSync } from 'fs';
import { dirname, extname } from 'path';

import type { File } from '@babel/types';

import type { CustomDebug } from '@linaria/logger';
import { createCustomDebug } from '@linaria/logger';
import type {
  Evaluator,
  EvaluatorConfig,
  IMetadata,
  StrictOptions,
} from '@linaria/utils';
import {
  buildOptions,
  getFileIdx,
  isFeatureEnabled,
  loadBabelOptions,
} from '@linaria/utils';

import type { Core } from '../babel';
import type { TransformCacheCollection } from '../cache';
import preeval from '../plugins/preeval';
import type { ITransformFileResult, Options } from '../types';

import type { IEntrypoint, NextItem, OnSuccess } from './helpers/ModuleQueue';
import { ModuleQueue } from './helpers/ModuleQueue';
import { getMatchedRule, parseFile } from './helpers/parseFile';

// const isModuleResolver = (i: unknown): i is { options: unknown } =>
//   typeof i === 'object' &&
//   i !== null &&
//   (i as { key?: string }).key === 'module-resolver';

// function runPreevalStage(
//   babel: Core,
//   item: IEntrypoint,
//   ast: File,
//   pluginOptions: StrictOptions,
//   options: Pick<Options, 'root' | 'inputSourceMap'>
// ): BabelFileResult {
//   const { code, name: filename, parseConfig } = item;
//
//   const transformPlugins: babel.PluginItem[] = [
//     [require.resolve('../plugins/preeval'), pluginOptions],
//   ];
//
//   const moduleResolverPlugin = parseConfig.plugins?.find(isModuleResolver);
//   if (moduleResolverPlugin) {
//     transformPlugins.unshift(moduleResolverPlugin);
//   }
//
//   const transformConfig = buildOptions({
//     ast: true,
//     babelrc: false,
//     configFile: false,
//     envName: 'linaria',
//     inputSourceMap: options.inputSourceMap,
//     plugins: transformPlugins,
//     root: options.root,
//     sourceFileName: filename,
//     sourceMaps: true,
//   });
//
//   const result = babel.transformFromAstSync(ast, code, {
//     ...transformConfig,
//     filename,
//   });
//
//   if (!result || !result.ast?.program) {
//     throw new Error('Babel transform failed');
//   }
//
//   return result;
// }

export function prepareCode(
  babel: Core,
  item: IEntrypoint,
  originalAst: File,
  pluginOptions: StrictOptions
): [ast: File, code: string, metadata: IMetadata] {
  const { evaluator, name: filename, only, deadImports = [] } = item;

  const log = createCustomDebug('transform', getFileIdx(filename));

  // const preevalStageResult = runPreevalStage(
  //   babel,
  //   item,
  //   originalAst,
  //   pluginOptions,
  //   options
  // );
  //
  // if (
  //   only.length === 1 &&
  //   only[0] === '__linariaPreval' &&
  //   !withLinariaMetadata(preevalStageResult.metadata)
  // ) {
  //   log('stage-1:evaluator:end', 'no metadata');
  //   return [
  //     preevalStageResult.ast!,
  //     preevalStageResult.code!,
  //     null,
  //     null,
  //     [],
  //     preevalStageResult.metadata,
  //   ];
  // }
  //
  // log('stage-1:preeval', 'metadata %O', preevalStageResult.metadata);

  log('stage-1:evaluator:start', 'using %s', evaluator.name);

  const evaluatorConfig: EvaluatorConfig = {
    onlyExports: only,
    deadImports,
    preeval: (babelCore, file) => preeval(babelCore, pluginOptions, file),
    highPriorityPlugins: pluginOptions.highPriorityPlugins,
    features: pluginOptions.features,
  };

  const { ast, code, metadata } = evaluator(
    item.parseConfig,
    originalAst,
    item.code,
    evaluatorConfig,
    babel
  );

  log('stage-1:evaluator:end', '');

  return [ast, code, metadata];
}

function processQueueItem(
  babel: Core,
  item: IEntrypoint | null,
  cache: TransformCacheCollection,
  pluginOptions: StrictOptions
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

  const ast: File =
    cache.originalASTCache.get(name) ??
    parseFile(babel, name, code, parseConfig);

  const log = createCustomDebug('transform', getFileIdx(name));

  cache.originalASTCache.set(name, ast);

  const onlyAsStr = only.join(', ');
  log('stage-1', `>> (${onlyAsStr})`);

  const [preparedAst, preparedCode, metadata] = prepareCode(
    babel,
    item,
    ast,
    pluginOptions
  );

  if (code === preparedCode) {
    log('stage-1', `<< (${onlyAsStr})\n === no changes ===`);
  } else {
    log('stage-1', `<< (${onlyAsStr})\n${preparedCode}`);
  }

  if (preparedCode === '') return undefined;

  return {
    imports: metadata.linariaEvaluator.imports ?? [],
    name,
    result: {
      ast: preparedAst,
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
  code: string,
  pluginOptions: StrictOptions,
  options: Pick<Options, 'root' | 'inputSourceMap'>
): IEntrypoint | 'ignored' {
  const log = createCustomDebug('transform', getFileIdx(name));
  const extension = extname(name);

  if (!pluginOptions.extensions.includes(extension)) {
    log(
      'createEntrypoint',
      `${name} is ignored. If you want it to be processed, you should add '${extension}' to the "extensions" option.`
    );

    return 'ignored';
  }

  const { action, babelOptions } = getMatchedRule(
    pluginOptions.rules,
    name,
    code
  );

  if (action === 'ignore') {
    log('createEntrypoint', `${name} is ignored by rule`);
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
  }[]
) {
  const allImports = resolvedImports.flatMap((i) =>
    i.importsOnly.map((what) => ({
      from: i.importedFile,
      what,
      file: i.resolved,
    }))
  );
  const deadImports: typeof allImports = [];
  const remaining = new Set(allImports.map((i) => i.file));

  const deleteDeadImports = (
    entrypoint: IEntrypoint,
    result: ITransformFileResult,
    isLast: boolean
  ) => {
    if (
      !isFeatureEnabled(
        pluginOptions.features,
        'deadImportsRemover',
        parent.entrypoint.name
      )
    ) {
      return;
    }

    result.metadata?.linariaEvaluator.deadExports.forEach((deadExport) => {
      // FIXME: handle cases with `export * from './foo'`
      const relatedImport = allImports.find(
        (i) => i.file === entrypoint.name && i.what === deadExport
      );

      if (relatedImport) {
        deadImports.push(relatedImport);
      }
    });

    if (isLast) {
      if (deadImports.length === 0) {
        return;
      }

      log(
        'stage-1:resolve',
        `imports %s in %s is dead. Removing...`,
        deadImports.map((i) => i.what).join(', '),
        parent.entrypoint.name
      );

      cache.codeCache.delete(parent.entrypoint.name);
      queue.enqueue(
        [
          {
            ...parent.entrypoint,
            deadImports,
          },
          parent.stack,
        ],
        parent.onSuccess
      );
    }
  };

  const onEveryImport: OnSuccess = (entrypoint, result) => {
    remaining.delete(entrypoint.name);
    deleteDeadImports(entrypoint, result, remaining.size === 0);
  };

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

    const fileContent = readFileSync(resolved, 'utf8');
    const next = createEntrypoint(
      babel,
      resolved,
      importsOnly,
      fileContent,
      pluginOptions,
      options
    );
    if (next === 'ignored') {
      continue;
    }

    queue.enqueue(
      [next, [parent.entrypoint.name, ...parent.stack]],
      onEveryImport
    );
  }
}

// FIXME: naming
function processEntrypoint(
  babel: Core,
  log: CustomDebug,
  cache: TransformCacheCollection,
  pluginOptions: StrictOptions,
  options: Pick<Options, 'root' | 'inputSourceMap'>,
  nextItem: NextItem
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
      pluginOptions
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
  options: Pick<Options, 'root' | 'inputSourceMap'>
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
    options
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
      item
    );
    if (processResult === 'skip') {
      continue;
    }

    const { imports, result, only: mergedOnly } = processResult;

    if (imports) {
      const resolvedImports = Array.from(imports?.entries() ?? []).map(
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

      processImports(
        babel,
        log,
        cache,
        queue,
        pluginOptions,
        options,
        item,
        resolvedImports
      );
    } else {
      log('stage-1', '%s has no imports', item.entrypoint.name);
    }

    cache.codeCache.set(item.entrypoint.name, {
      imports,
      only: mergedOnly,
      result,
    });

    item.onSuccess(item.entrypoint, result);
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
  options: Pick<Options, 'root' | 'inputSourceMap'>
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
    options
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
      item
    );
    if (processResult === 'skip') {
      continue;
    }

    const { imports, result, only: mergedOnly } = processResult;

    if (imports && imports.size > 0) {
      const resolvedImports = await Promise.all(
        Array.from(imports?.entries() ?? []).map(
          async ([importedFile, importsOnly]) => {
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
          }
        )
      );

      processImports(
        babel,
        log,
        cache,
        queue,
        pluginOptions,
        options,
        item,
        resolvedImports
      );
    } else {
      log('stage-1', '%s has no imports', item.entrypoint.name);
    }

    cache.codeCache.set(item.entrypoint.name, {
      imports,
      only: mergedOnly,
      result,
    });

    item.onSuccess(item.entrypoint, result);
  }

  log('stage-1', 'queue is empty, %s is ready', entrypoint.name);

  return cache.codeCache.get(entrypoint.name)?.result;
}
