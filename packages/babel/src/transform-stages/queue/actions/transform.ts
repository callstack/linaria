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
import type { Next } from '../../helpers/ActionQueue';
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

  const onPreevalFinished = eventEmitter.pair({
    method: 'queue:transform:preeval',
  });
  const preevalStageResult = runPreevalStage(
    babel,
    item,
    originalAst,
    eventEmitter
  );
  onPreevalFinished();

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

  const onEvaluatorFinished = eventEmitter.pair({
    method: 'queue:transform:evaluator',
  });
  const [, code, imports] = evaluator(
    evalConfig,
    preevalStageResult.ast!,
    preevalStageResult.code!,
    evaluatorConfig,
    babel
  );
  onEvaluatorFinished();

  log('[evaluator:end]');

  return [code, imports, preevalStageResult.metadata];
}

// const getWildcardReexport = (babel: Core, ast: File): string[] => {
//   const reexportsFrom: string[] = [];
//   ast.program.body.forEach((node) => {
//     if (
//       babel.types.isExportAllDeclaration(node) &&
//       node.source &&
//       babel.types.isStringLiteral(node.source)
//     ) {
//       reexportsFrom.push(node.source.value);
//     }
//   });
//
//   return reexportsFrom;
// };

/**
 * Prepares the code for evaluation. This includes removing dead and potentially unsafe code.
 * If prepared code has imports, they will be resolved in the next step.
 * In the end, the prepared code is added to the cache.
 */
export function transform(
  { babel, eventEmitter }: Services,
  action: ITransformAction,
  next: Next
): void {
  if (!action) {
    return;
  }

  const { name, only, code, log, ast } = action.entrypoint;

  log('>> (%o)', only);

  // const reexportsFrom = getWildcardReexport(babel, ast);
  // if (reexportsFrom.length) {
  //   log('has wildcard reexport from %o', reexportsFrom);
  //
  //   // Resolve modules
  //   next({
  //     type: 'resolveImports',
  //     entrypoint: action.entrypoint,
  //     imports: new Map(reexportsFrom.map((i) => [i, ['*']])),
  //     stack: action.stack,
  //     callback: (resolvedImports) => {
  //       console.log('!!!', resolvedImports);
  //     },
  //   });
  //
  //   // Replace wildcard reexport with named reexports
  //
  //   // Reprocess the code
  //
  //   return;
  // }

  const [preparedCode, imports, metadata] = prepareCode(
    babel,
    action.entrypoint,
    ast,
    eventEmitter
  );

  if (code === preparedCode) {
    log('<< (%o)\n === no changes ===', only);
  } else {
    log('<< (%o)\n%s', only, preparedCode || EMPTY_FILE);
  }

  if (preparedCode === '') {
    log('%s is skipped', name);
    return;
  }

  next({
    type: 'resolveImports',
    entrypoint: action.entrypoint,
    imports,
    stack: action.stack,
    callback: (resolvedImports) => {
      next({
        type: 'processImports',
        entrypoint: action.entrypoint,
        resolved: resolvedImports,
        stack: action.stack,
      });
    },
  });

  next({
    type: 'addToCodeCache',
    entrypoint: action.entrypoint,
    data: {
      imports,
      result: {
        code: preparedCode,
        metadata,
      },
      only,
    },
    stack: action.stack,
  });
}
