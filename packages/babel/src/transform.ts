/**
 * This file exposes transform function that:
 * - parse the passed code to AST
 * - transforms the AST using Linaria babel preset ('./babel/index.js) and additional config defined in Linaria config file or passed to bundler configuration.
 * - runs generated CSS files through default of user-defined preprocessor
 * - generates source maps for CSS files
 * - return transformed code (without Linaria template literals), generated CSS, source maps and babel metadata from transform step.
 */

import type { TransformOptions } from '@babel/core';
import * as babel from '@babel/core';

import { EventEmitter } from '@linaria/utils';
import type { StrictOptions } from '@linaria/utils';

import { TransformCacheCollection } from './cache';
import prepareForEval, {
  prepareForEvalSync,
} from './transform-stages/1-prepare-for-eval';
import evalStage from './transform-stages/2-eval';
import prepareForRuntime from './transform-stages/3-prepare-for-runtime';
import extractStage from './transform-stages/4-extract';
import loadLinariaOptions from './transform-stages/helpers/loadLinariaOptions';
import type { Options, Result, ITransformFileResult } from './types';
import withLinariaMetadata from './utils/withLinariaMetadata';

function syncStages(
  originalCode: string,
  pluginOptions: StrictOptions,
  options: Pick<
    Options,
    'filename' | 'inputSourceMap' | 'root' | 'preprocessor' | 'outputFilename'
  >,
  prepareStageResult: ITransformFileResult | undefined,
  babelConfig: TransformOptions,
  cache: TransformCacheCollection,
  eventEmitter = EventEmitter.dummy
) {
  const { filename } = options;
  const ast = cache.originalASTCache.get(filename) ?? 'ignored';

  // File is ignored or does not contain any tags. Return original code.
  if (
    ast === 'ignored' ||
    !prepareStageResult ||
    !withLinariaMetadata(prepareStageResult.metadata)
  ) {
    return {
      code: originalCode,
      sourceMap: options.inputSourceMap,
    };
  }

  // *** 2nd stage ***

  const finishStage2Event = eventEmitter.pair({ stage: 'stage-2', filename });

  const evalStageResult = evalStage(
    cache,
    prepareStageResult.code,
    pluginOptions,
    filename
  );

  finishStage2Event();

  if (evalStageResult === null) {
    return {
      code: originalCode,
      sourceMap: options.inputSourceMap,
    };
  }

  const [valueCache, dependencies] = evalStageResult;

  // *** 3rd stage ***

  const finishStage3Event = eventEmitter.pair({ stage: 'stage-3', filename });

  const collectStageResult = prepareForRuntime(
    babel,
    ast,
    originalCode,
    valueCache,
    pluginOptions,
    options,
    babelConfig
  );

  finishStage3Event();

  if (!withLinariaMetadata(collectStageResult.metadata)) {
    return {
      code: collectStageResult.code!,
      sourceMap: collectStageResult.map,
    };
  }

  // *** 4th stage

  const finishStage4Event = eventEmitter.pair({ stage: 'stage-4', filename });

  const extractStageResult = extractStage(
    collectStageResult.metadata.linaria.processors,
    originalCode,
    options
  );

  finishStage4Event();

  return {
    ...extractStageResult,
    code: collectStageResult.code ?? '',
    dependencies,
    replacements: [
      ...extractStageResult.replacements,
      ...collectStageResult.metadata.linaria.replacements,
    ],
    sourceMap: collectStageResult.map,
  };
}

export function transformSync(
  originalCode: string,
  options: Options,
  syncResolve: (what: string, importer: string, stack: string[]) => string,
  babelConfig: TransformOptions = {},
  cache = new TransformCacheCollection(),
  eventEmitter = EventEmitter.dummy
): Result {
  const { filename } = options;
  // *** 1st stage ***

  const finishEvent = eventEmitter.pair({ stage: 'stage-1', filename });

  const entrypoint = {
    name: options.filename,
    code: originalCode,
    only: ['__linariaPreval'],
  };

  const pluginOptions = loadLinariaOptions(options.pluginOptions);
  const prepareStageResults = prepareForEvalSync(
    babel,
    cache,
    syncResolve,
    entrypoint,
    pluginOptions,
    options
  );

  finishEvent();

  // *** The rest of the stages are synchronous ***

  return syncStages(
    originalCode,
    pluginOptions,
    options,
    prepareStageResults,
    babelConfig,
    cache,
    eventEmitter
  );
}

export default async function transform(
  originalCode: string,
  options: Options,
  asyncResolve: (
    what: string,
    importer: string,
    stack: string[]
  ) => Promise<string | null>,
  babelConfig: TransformOptions = {},
  cache = new TransformCacheCollection(),
  eventEmitter = EventEmitter.dummy
): Promise<Result> {
  const { filename } = options;

  // Cache may contain a code that was loaded from disk, but transform
  // is called with a code that already processed by another loaders
  cache.invalidateIfChanged(filename, originalCode);

  // *** 1st stage ***

  const finishEvent = eventEmitter.pair({ stage: 'stage-1', filename });

  const entrypoint = {
    name: filename,
    code: originalCode,
    only: ['__linariaPreval'],
  };

  const pluginOptions = loadLinariaOptions(options.pluginOptions);
  const prepareStageResults = await prepareForEval(
    babel,
    cache,
    asyncResolve,
    entrypoint,
    pluginOptions,
    options,
    eventEmitter
  );

  finishEvent();

  // *** The rest of the stages are synchronous ***

  return syncStages(
    originalCode,
    pluginOptions,
    options,
    prepareStageResults,
    babelConfig,
    cache,
    eventEmitter
  );
}
