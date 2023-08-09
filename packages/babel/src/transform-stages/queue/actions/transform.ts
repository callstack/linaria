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
import type { IEntrypoint, ITransformAction, Services } from '../types';

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

export function prepareCode(
  babel: Core,
  item: IEntrypoint,
  originalAst: File,
  eventEmitter: EventEmitter
): [code: string, imports: Module['imports'], metadata?: BabelFileMetadata] {
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
}

/**
 * Prepares the code for evaluation. This includes removing dead and potentially unsafe code.
 * Emits resolveImports, processImports and addToCodeCache events.
 */
export function transform(
  services: Services,
  action: ITransformAction,
  callbacks: { done: () => void }
): void {
  if (!action) {
    return;
  }

  const { name, only, code, log, ast } = action.entrypoint;

  log('>> (%o)', only);

  const [preparedCode, imports, metadata] = prepareCode(
    services.babel,
    action.entrypoint,
    ast,
    services.eventEmitter
  );

  if (code === preparedCode) {
    log('<< (%o)\n === no changes ===', only);
  } else {
    log('<< (%o)\n%s', only, preparedCode || EMPTY_FILE);
  }

  if (preparedCode === '') {
    log('%s is skipped', name);
    callbacks.done();
    return;
  }

  action
    .next('resolveImports', action.entrypoint, {
      imports,
    })
    .on('resolve', (resolvedImports) => {
      action.next('processImports', action.entrypoint, {
        resolved: resolvedImports,
      });
    });

  action
    .next('addToCodeCache', action.entrypoint, {
      data: {
        imports,
        result: {
          code: preparedCode,
          metadata,
        },
        only,
      },
    })
    .on('done', callbacks.done);
}
