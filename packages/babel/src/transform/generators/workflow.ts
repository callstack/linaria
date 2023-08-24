import withLinariaMetadata from '../../utils/withLinariaMetadata';
import type { IWorkflowAction, SyncScenarioForAction } from '../types';

export function* workflow(
  this: IWorkflowAction<'sync'>
): SyncScenarioForAction<IWorkflowAction<'sync'>> {
  const { cache, options } = this.services;
  const { entrypoint } = this;
  const { name, code: originalCode } = entrypoint;

  // *** 1st stage ***

  yield* this.getNext('processEntrypoint', entrypoint, undefined);

  const prepareStageResult = cache.get('code', name)?.result;
  const ast = cache.get('originalAST', name) ?? 'ignored';

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

  const evalStageResult = yield* this.getNext('evalFile', entrypoint, {
    code: prepareStageResult.code,
  });

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

  if (!withLinariaMetadata(collectStageResult.metadata)) {
    return {
      code: collectStageResult.code!,
      sourceMap: collectStageResult.map,
    };
  }

  const linariaMetadata = collectStageResult.metadata.linaria;

  // *** 4th stage

  const extractStageResult = yield* this.getNext('extract', entrypoint, {
    processors: linariaMetadata.processors,
  });

  return {
    ...extractStageResult,
    code: collectStageResult.code ?? '',
    dependencies,
    replacements: [
      ...extractStageResult.replacements,
      ...linariaMetadata.replacements,
    ],
    sourceMap: collectStageResult.map,
  };
}
