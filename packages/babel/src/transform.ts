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

import { TransformCacheCollection } from './cache';
import prepareForEval, {
  prepareForEvalSync,
} from './transform-stages/1-prepare-for-eval';
import evalStage from './transform-stages/2-eval';
import prepareForRuntime from './transform-stages/3-prepare-for-runtime';
import extractStage from './transform-stages/4-extract';
import type { Options, Result, ITransformFileResult } from './types';
import withLinariaMetadata from './utils/withLinariaMetadata';

function syncStages(
  originalCode: string,
  options: Options,
  prepareStageResult: ITransformFileResult | undefined,
  babelConfig: TransformOptions,
  cache: TransformCacheCollection,
  eventEmitter?: (ev: unknown) => void
) {
  const { filename } = options;

  // File does not contain any tags. Return original code.
  if (
    !prepareStageResult ||
    !withLinariaMetadata(prepareStageResult.metadata)
  ) {
    return {
      code: originalCode,
      sourceMap: options.inputSourceMap,
    };
  }

  // *** 2nd stage ***

  eventEmitter?.({ type: 'transform:stage-2:start', filename });

  const evalStageResult = evalStage(cache, prepareStageResult.code, options);

  eventEmitter?.({ type: 'transform:stage-2:finish', filename });

  if (evalStageResult === null) {
    return {
      code: originalCode,
      sourceMap: options.inputSourceMap,
    };
  }

  const [valueCache, dependencies] = evalStageResult;

  // *** 3rd stage ***

  eventEmitter?.({ type: 'transform:stage-3:start', filename });

  const collectStageResult = prepareForRuntime(
    babel,
    originalCode,
    valueCache,
    options,
    babelConfig
  );

  eventEmitter?.({ type: 'transform:stage-3:finish', filename });

  if (!withLinariaMetadata(collectStageResult.metadata)) {
    return {
      code: collectStageResult.code!,
      sourceMap: collectStageResult.map,
    };
  }

  // *** 4th stage

  eventEmitter?.({ type: 'transform:stage-4:start', filename });

  const extractStageResult = extractStage(
    collectStageResult.metadata.linaria.processors,
    originalCode,
    options
  );

  eventEmitter?.({ type: 'transform:stage-4:finish', filename });

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
  eventEmitter?: (ev: unknown) => void
): Result {
  const { filename } = options;
  // *** 1st stage ***

  eventEmitter?.({ type: 'transform:stage-1:start', filename });

  const entrypoint = {
    name: options.filename,
    code: originalCode,
    only: ['__linariaPreval'],
  };

  const prepareStageResults = prepareForEvalSync(
    babel,
    cache,
    syncResolve,
    entrypoint,
    options
  );

  eventEmitter?.({ type: 'transform:stage-1:finish', filename });

  // *** The rest of the stages are synchronous ***

  return syncStages(
    originalCode,
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
  eventEmitter?: (ev: unknown) => void
): Promise<Result> {
  const { filename } = options;

  // *** 1st stage ***

  eventEmitter?.({ type: 'transform:stage-1:start', filename });

  const entrypoint = {
    name: filename,
    code: originalCode,
    only: ['__linariaPreval'],
  };

  const prepareStageResults = await prepareForEval(
    babel,
    cache,
    asyncResolve,
    entrypoint,
    options
  );

  eventEmitter?.({ type: 'transform:stage-1:finish', filename });

  // *** The rest of the stages are synchronous ***

  return syncStages(
    originalCode,
    options,
    prepareStageResults,
    babelConfig,
    cache,
    eventEmitter
  );
}
