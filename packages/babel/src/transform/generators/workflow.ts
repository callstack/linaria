import { isAborted } from '../actions/AbortError';
import type {
  IWorkflowAction,
  SyncScenarioForAction,
  YieldArg,
} from '../types';

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

  entrypoint.abortIfSuperseded();

  using abortSignal = null;
  const { code: originalCode = '' } = entrypoint.loadedAndParsed;

  // *** 1st stage ***

  yield* this.getNext('processEntrypoint', entrypoint, undefined, abortSignal);
  entrypoint.abortIfSuperseded();

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
    undefined,
    abortSignal
  );

  if (evalStageResult === null) {
    return {
      code: originalCode,
      sourceMap: options.inputSourceMap,
    };
  }

  const [valueCache, dependencies] = evalStageResult;

  // *** 3rd stage ***

  const collectStageResult = yield* this.getNext(
    'collect',
    entrypoint,
    {
      valueCache,
    },
    abortSignal
  );

  if (!collectStageResult.metadata) {
    return {
      code: collectStageResult.code!,
      sourceMap: collectStageResult.map,
    };
  }

  // *** 4th stage

  const extractStageResult = yield* this.getNext(
    'extract',
    entrypoint,
    {
      processors: collectStageResult.metadata.processors,
    },
    abortSignal
  );

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

workflow.recover = (e: unknown, action: IWorkflowAction): YieldArg => {
  if (isAborted(e) && action.entrypoint.supersededWith) {
    action.entrypoint.log('aborting processing');
    return ['workflow', action.entrypoint.supersededWith, undefined, null];
  }

  action.entrypoint.log(`Unhandled error: %O`, e);
  throw e;
};
