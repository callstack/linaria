import withLinariaMetadata from '../../../utils/withLinariaMetadata';
import type { ActionGenerator, Services, IWorkflowAction } from '../types';

import { emitAndGetResultOf } from './helpers/emitAndGetResultOf';

export function* workflow(
  services: Services,
  action: IWorkflowAction
): ActionGenerator<IWorkflowAction> {
  const { cache, options } = services;
  const { entrypoint } = action;
  const { name, code: originalCode } = entrypoint;

  // *** 1st stage ***

  yield* emitAndGetResultOf('processEntrypoint', entrypoint, {});

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

  const evalStageResult = yield* emitAndGetResultOf('evalFile', entrypoint, {
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

  const collectStageResult = yield* emitAndGetResultOf('collect', entrypoint, {
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

  const extractStageResult = yield* emitAndGetResultOf('extract', entrypoint, {
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
