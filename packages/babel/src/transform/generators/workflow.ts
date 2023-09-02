import { isAborted } from '../actions/AbortError';
import type { IWorkflowAction, SyncScenarioForAction } from '../types';

/**
 * The entry point for file processing. Sequentially calls `processEntrypoint`,
 * `evalFile`, `collect`, and `extract`. Returns the result of transforming
 * the source code as well as all artifacts obtained from code execution.
 */
export function* workflow(
  this: IWorkflowAction
): SyncScenarioForAction<IWorkflowAction> {
  const { cache, options } = this.services;
  const { entrypoint } = this;
  if (entrypoint.ignored) {
    return {
      code: entrypoint.loadedAndParsed.code ?? '',
      sourceMap: options.inputSourceMap,
    };
  }

  const { code: originalCode = '' } = entrypoint.loadedAndParsed;

  // *** 1st stage ***

  try {
    yield* this.getNext('processEntrypoint', entrypoint, undefined);
  } catch (e) {
    if (isAborted(e) && entrypoint.supersededWith) {
      entrypoint.log('entrypoint superseded, rescheduling workflow');
      yield* this.getNext('workflow', entrypoint.supersededWith!, undefined);
    } else {
      throw e;
    }
  }

  // File is ignored or does not contain any tags. Return original code.
  if (!entrypoint.hasLinariaMetadata()) {
    if (entrypoint.generation === 1) {
      // 1st generation here means that it's __linariaPreval entrypoint
      // without __linariaPreval, so we don't need it cached
      cache.delete('entrypoints', entrypoint.name);
    }

    return {
      code: originalCode,
      sourceMap: options.inputSourceMap,
    };
  }

  // *** 2nd stage ***

  const evalStageResult = yield* this.getNext(
    'evalFile',
    entrypoint,
    undefined
  );

  if (evalStageResult === null) {
    return {
      code: originalCode,
      sourceMap: options.inputSourceMap,
    };
  }

  const [valueCache, dependencies] = evalStageResult;

  // *** 3rd stage ***

  const collectStageResult = yield* this.getNext('collect', entrypoint, {
    valueCache,
  });

  if (!collectStageResult.metadata) {
    return {
      code: collectStageResult.code!,
      sourceMap: collectStageResult.map,
    };
  }

  // *** 4th stage

  const extractStageResult = yield* this.getNext('extract', entrypoint, {
    processors: collectStageResult.metadata.processors,
  });

  return {
    ...extractStageResult,
    code: collectStageResult.code ?? '',
    dependencies,
    replacements: [
      ...extractStageResult.replacements,
      ...collectStageResult.metadata.replacements,
    ],
    sourceMap: collectStageResult.map,
  };
}
