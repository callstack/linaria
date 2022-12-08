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

import cachedParseSync from './helpers/cachedParseSync';
import loadLinariaOptions from './helpers/loadLinariaOptions';

export type FileInQueue = {
  name: string;
  code: string;
  only: string[];
} | null;

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
  options: Pick<Options, 'root' | 'pluginOptions' | 'inputSourceMap'>,
  fileCache: Map<string | symbol, ITransformFileResult>
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
    fileCache.set('*', {
      code: originalCode,
    });

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
      results: ITransformFileResult[];
    }
  | undefined {
  if (!item) {
    return undefined;
  }
  const { codeCache } = cache;
  const pluginOptions = loadLinariaOptions(options.pluginOptions);

  const results = new Set<ITransformFileResult>();

  const { name, only, code } = item;
  if (!codeCache.has(name)) {
    codeCache.set(name, new Map());
  }

  const log = createCustomDebug('transform', getFileIdx(name));

  const extension = extname(name);
  if (!pluginOptions.extensions.includes(extension)) {
    log(
      'init',
      `${name} is ignored. If you want it to be processed, you should add '${extension}' to the "extensions" option.`
    );
    return undefined;
  }

  log('init', `${name} (${only.join(', ')})\n${code}`);

  const uncachedExports = new Set(only);
  const fileCache = codeCache.get(name)!;
  uncachedExports.forEach((token) => {
    if (fileCache.has(token)) {
      uncachedExports.delete(token);
      results.add(fileCache.get(token)!);
    }
  });

  if (uncachedExports.size === 0) {
    // Already processed
    return {
      imports: null,
      name,
      results: Array.from(results),
    };
  }

  const remainExports = Array.from(uncachedExports);

  log('stage-1', `>> (${remainExports.join(', ')})`);

  const [preparedCode, imports, metadata] = prepareCode(
    babel,
    name,
    code,
    remainExports,
    options,
    fileCache
  );

  if (code === preparedCode) {
    log('stage-1', `<< (${remainExports.join(', ')})\n === no changes ===`);
  } else {
    log('stage-1', `<< (${remainExports.join(', ')})\n${preparedCode}`);
  }

  const result = {
    metadata,
    code: preparedCode,
  };
  results.add(result);

  remainExports.forEach((token) => {
    fileCache.set(token, result);
  });

  if (preparedCode === '') return undefined;

  return {
    imports,
    name,
    results: Array.from(results),
  };
}

export function prepareForEvalSync(
  babel: Core,
  cache: TransformCacheCollection,
  resolve: (what: string, importer: string, stack: string[]) => string,
  resolvedFile: FileInQueue,
  options: Pick<Options, 'root' | 'pluginOptions' | 'inputSourceMap'>,
  stack: string[] = []
): ITransformFileResult[] | undefined {
  const processed = processQueueItem(babel, resolvedFile, cache, options);
  if (!processed) return undefined;

  const { imports, name, results } = processed;

  const log = createCustomDebug('transform', getFileIdx(name));

  const queue: FileInQueue[] = [];

  imports?.forEach((importsOnly, importedFile) => {
    try {
      const resolved = resolve(importedFile, name, stack);
      log('stage-1:sync-resolve', `✅ ${importedFile} -> ${resolved}`);
      cache.resolveCache.set(
        `${name} -> ${importedFile}`,
        `${resolved}\0${importsOnly.join(',')}`
      );
      const fileContent = readFileSync(resolved, 'utf8');
      queue.push({
        name: resolved,
        only: importsOnly,
        code: fileContent,
      });
    } catch (err) {
      log('stage-1:sync-resolve', `❌ cannot resolve ${importedFile}: %O`, err);
    }
  });

  queue.forEach((item) => {
    prepareForEvalSync(babel, cache, resolve, item, options, [name, ...stack]);
  });

  return Array.from(results);
}

const mutexes = new Map<string, Promise<void>>();

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
  file: Promise<FileInQueue>,
  options: Pick<Options, 'root' | 'pluginOptions' | 'inputSourceMap'>,
  stack: string[] = []
): Promise<ITransformFileResult[] | undefined> {
  const resolvedFile = await file;
  const mutex = resolvedFile ? mutexes.get(resolvedFile.name) : null;
  if (mutex) {
    await mutex;
  }

  const processed = processQueueItem(babel, resolvedFile, cache, options);
  if (!processed) return undefined;

  const { imports, name, results } = processed;

  const log = createCustomDebug('transform', getFileIdx(name));

  const promises: Promise<ITransformFileResult[] | undefined>[] = [];

  imports?.forEach((importsOnly, importedFile) => {
    const promise = resolve(importedFile, name, stack).then(
      (resolved) => {
        if (resolved === null) {
          log('stage-1:resolve', `✅ ${importedFile} is ignored`);
          return null;
        }

        log('stage-1:async-resolve', `✅ ${importedFile} -> ${resolved}`);
        const resolveCacheKey = `${name} -> ${importedFile}`;
        const cached = cache.resolveCache.get(resolveCacheKey);
        const importsOnlySet = new Set(importsOnly);
        if (cached) {
          const [, cachedOnly] = cached.split('\0');
          cachedOnly?.split(',').forEach((token) => {
            importsOnlySet.add(token);
          });
        }

        cache.resolveCache.set(
          resolveCacheKey,
          `${resolved}\0${[...importsOnlySet].join(',')}`
        );
        const fileContent = readFileSync(resolved, 'utf8');
        return {
          name: resolved,
          only: importsOnly,
          code: fileContent,
        };
      },
      (err: unknown) => {
        log(
          'stage-1:async-resolve',
          `❌ cannot resolve ${importedFile}: %O`,
          err
        );
        return null;
      }
    );

    promises.push(
      prepareForEval(babel, cache, resolve, promise, options, [name, ...stack])
    );
  });

  const promise = Promise.all(promises).then(() => {});

  mutexes.set(name, promise);

  await promise;

  mutexes.delete(name);

  return Array.from(results);
}
