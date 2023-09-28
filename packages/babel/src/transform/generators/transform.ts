import type {
  BabelFileResult,
  PluginItem,
  TransformOptions,
} from '@babel/core';
import type { File } from '@babel/types';

import type {
  EvaluatorConfig,
  EventEmitter,
  LinariaMetadata,
  StrictOptions,
} from '@linaria/utils';
import { buildOptions, getPluginKey } from '@linaria/utils';

import type { Core } from '../../babel';
import { getLinariaMetadata } from '../../utils/withLinariaMetadata';
import type { Entrypoint } from '../Entrypoint';
import type {
  ITransformAction,
  Services,
  SyncScenarioForAction,
} from '../types';

const EMPTY_FILE = '=== empty file ===';

const hasKeyInList = (plugin: PluginItem, list: string[]): boolean => {
  const pluginKey = getPluginKey(plugin);
  return pluginKey ? list.some((i) => pluginKey.includes(i)) : false;
};

function runPreevalStage(
  babel: Core,
  evalConfig: TransformOptions,
  pluginOptions: StrictOptions,
  code: string,
  originalAst: File,
  eventEmitter: EventEmitter
): BabelFileResult {
  const preShakePlugins =
    evalConfig.plugins?.filter((i) =>
      hasKeyInList(i, pluginOptions.highPriorityPlugins)
    ) ?? [];

  const plugins = [
    ...preShakePlugins,
    [
      require.resolve('../../plugins/preeval'),
      { ...pluginOptions, eventEmitter },
    ],
    [require.resolve('../../plugins/dynamic-import')],
    ...(evalConfig.plugins ?? []).filter(
      (i) => !hasKeyInList(i, pluginOptions.highPriorityPlugins)
    ),
  ];

  const transformConfig = buildOptions({
    ...evalConfig,
    envName: 'linaria',
    plugins,
  });

  const result = babel.transformFromAstSync(originalAst, code, transformConfig);

  if (!result || !result.ast?.program) {
    throw new Error('Babel transform failed');
  }

  return result;
}

type PrepareCodeFn = (
  services: Services,
  item: Entrypoint,
  originalAst: File
) => [
  code: string,
  imports: Map<string, string[]> | null,
  metadata: LinariaMetadata | null,
];

export const prepareCode = (
  services: Services,
  item: Entrypoint,
  originalAst: File
): ReturnType<PrepareCodeFn> => {
  const { log, only, loadedAndParsed } = item;
  if (loadedAndParsed.evaluator === 'ignored') {
    log('is ignored');
    return [loadedAndParsed.code ?? '', null, null];
  }

  const { code, evalConfig, evaluator } = loadedAndParsed;
  const { options, babel, eventEmitter } = services;
  const { pluginOptions } = options;

  const preevalStageResult = eventEmitter.perf('transform:preeval', () =>
    runPreevalStage(
      babel,
      evalConfig,
      pluginOptions,
      code,
      originalAst,
      eventEmitter
    )
  );

  const linariaMetadata = getLinariaMetadata(preevalStageResult.metadata);

  if (only.length === 1 && only[0] === '__linariaPreval' && !linariaMetadata) {
    log('[evaluator:end] no metadata');
    return [preevalStageResult.code!, null, null];
  }

  log('[preeval] metadata %O', linariaMetadata);
  log('[evaluator:start] using %s', evaluator.name);

  const evaluatorConfig: EvaluatorConfig = {
    onlyExports: only,
    highPriorityPlugins: pluginOptions.highPriorityPlugins,
    features: pluginOptions.features,
  };

  const [, transformedCode, imports] = eventEmitter.perf(
    'transform:evaluator',
    () =>
      evaluator(
        evalConfig,
        preevalStageResult.ast!,
        preevalStageResult.code!,
        evaluatorConfig,
        babel
      )
  );

  log('[evaluator:end]');

  return [transformedCode, imports, linariaMetadata ?? null];
};

export function* internalTransform(
  this: ITransformAction,
  prepareFn: PrepareCodeFn
): SyncScenarioForAction<ITransformAction> {
  const { only, loadedAndParsed, log } = this.entrypoint;
  if (loadedAndParsed.evaluator === 'ignored') {
    log('is ignored');
    return {
      code: loadedAndParsed.code ?? '',
      metadata: null,
    };
  }

  log('>> (%o)', only);

  const [preparedCode, imports, metadata] = prepareFn(
    this.services,
    this.entrypoint,
    loadedAndParsed.ast
  );

  if (loadedAndParsed.code === preparedCode) {
    log('<< (%o)\n === no changes ===', only);
  } else {
    log('<< (%o)', only);
    log.extend('source')('%s', preparedCode || EMPTY_FILE);
  }

  if (preparedCode === '') {
    log('is skipped');
    return {
      code: loadedAndParsed.code ?? '',
      metadata: null,
    };
  }

  if (imports !== null && imports.size > 0) {
    const resolvedImports = yield* this.getNext(
      'resolveImports',
      this.entrypoint,
      {
        imports,
      }
    );

    if (resolvedImports.length !== 0) {
      yield [
        'processImports',
        this.entrypoint,
        {
          resolved: resolvedImports,
        },
      ];
    }
  }

  return {
    code: preparedCode,
    metadata,
  };
}

/**
 * Prepares the code for evaluation. This includes removing dead and potentially unsafe code.
 * Emits resolveImports and processImports events.
 */
export function transform(this: ITransformAction) {
  return internalTransform.call(this, prepareCode);
}
