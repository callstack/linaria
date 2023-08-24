import type {
  BabelFileMetadata,
  BabelFileResult,
  PluginItem,
} from '@babel/core';
import type { File } from '@babel/types';

import type { EvaluatorConfig, EventEmitter } from '@linaria/utils';
import { buildOptions, getPluginKey } from '@linaria/utils';

import type { Core } from '../../../babel';
import type Module from '../../../module';
import withLinariaMetadata from '../../../utils/withLinariaMetadata';
import type {
  IEntrypoint,
  ITransformAction,
  SyncScenarioForAction,
} from '../types';

const EMPTY_FILE = '=== empty file ===';

const hasKeyInList = (plugin: PluginItem, list: string[]): boolean => {
  const pluginKey = getPluginKey(plugin);
  return pluginKey ? list.some((i) => pluginKey.includes(i)) : false;
};

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
    [
      require.resolve('../../../plugins/preeval'),
      { ...pluginOptions, eventEmitter },
    ],
    [require.resolve('../../../plugins/dynamic-import')],
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

type PrepareCodeFn = (
  babel: Core,
  item: IEntrypoint,
  originalAst: File,
  eventEmitter: EventEmitter
) => [code: string, imports: Module['imports'], metadata?: BabelFileMetadata];

export const prepareCode: PrepareCodeFn = (
  babel,
  item,
  originalAst,
  eventEmitter
) => {
  const { evaluator, log, evalConfig, pluginOptions, only } = item;

  const preevalStageResult = eventEmitter.pair(
    {
      method: 'queue:transform:preeval',
    },
    () => runPreevalStage(babel, item, originalAst, eventEmitter)
  );

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

  const [, code, imports] = eventEmitter.pair(
    {
      method: 'queue:transform:evaluator',
    },
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

  return [code, imports, preevalStageResult.metadata];
};

export function* internalTransform(
  this: ITransformAction<'sync'>,
  prepareFn: PrepareCodeFn
): SyncScenarioForAction<ITransformAction<'sync'>> {
  const { babel, eventEmitter } = this.services;
  const { name, only, code, log, ast } = this.entrypoint;

  log('>> (%o)', only);

  const [preparedCode, imports, metadata] = prepareFn(
    babel,
    this.entrypoint,
    ast,
    eventEmitter
  );

  if (code === preparedCode) {
    log('<< (%o)\n === no changes ===', only);
  } else {
    log('<< (%o)', only);
    log.extend('source')('%s', preparedCode || EMPTY_FILE);
  }

  if (preparedCode === '') {
    log('%s is skipped', name);
    return;
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

  yield [
    'addToCodeCache',
    this.entrypoint,
    {
      imports,
      result: {
        code: preparedCode,
        metadata,
      },
      only,
    },
  ];
}

/**
 * Prepares the code for evaluation. This includes removing dead and potentially unsafe code.
 * Emits resolveImports, processImports and addToCodeCache events.
 */
export function transform(this: ITransformAction<'sync'>) {
  return internalTransform.call(this, prepareCode);
}
