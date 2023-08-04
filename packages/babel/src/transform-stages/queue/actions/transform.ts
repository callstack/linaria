import type {
  BabelFileMetadata,
  BabelFileResult,
  PluginItem,
} from '@babel/core';
import type {
  ExportAllDeclaration,
  File,
  Node,
  ExportNamedDeclaration,
} from '@babel/types';

import type { EvaluatorConfig, EventEmitter } from '@linaria/utils';
import { buildOptions, getPluginKey } from '@linaria/utils';

import type { Core } from '../../../babel';
import type Module from '../../../module';
import withLinariaMetadata from '../../../utils/withLinariaMetadata';
import type { Next } from '../../helpers/ActionQueue';
import { createEntrypoint } from '../createEntrypoint';
import type { IEntrypoint, ITransformAction, Services } from '../types';

import { findExportsInFiles } from './getExports';

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

const getWildcardReexport = (babel: Core, ast: File) => {
  const reexportsFrom: { source: string; node: ExportAllDeclaration }[] = [];
  ast.program.body.forEach((node) => {
    if (
      babel.types.isExportAllDeclaration(node) &&
      node.source &&
      babel.types.isStringLiteral(node.source)
    ) {
      reexportsFrom.push({
        source: node.source.value,
        node,
      });
    }
  });

  return reexportsFrom;
};

/**
 * Prepares the code for evaluation. This includes removing dead and potentially unsafe code.
 * If prepared code has imports, they will be resolved in the next step.
 * In the end, the prepared code is added to the cache.
 */
export function transform(
  services: Services,
  action: ITransformAction,
  next: Next
): void {
  if (!action) {
    return;
  }

  const { name, only, code, log, ast } = action.entrypoint;

  log('>> (%o)', only);

  const reexportsFrom = getWildcardReexport(services.babel, ast);
  if (reexportsFrom.length) {
    log('has wildcard reexport from %o', reexportsFrom);

    let remaining = reexportsFrom.length;
    const replacements = new Map<ExportAllDeclaration, Node | null>();
    const onResolved = (res: Record<string, string[]>) => {
      remaining -= 1;

      Object.entries(res).forEach(([source, identifiers]) => {
        const reexport = reexportsFrom.find((i) => i.source === source);
        if (reexport) {
          replacements.set(
            reexport.node,
            identifiers.length
              ? services.babel.types.exportNamedDeclaration(
                  null,
                  identifiers.map((i) =>
                    services.babel.types.exportSpecifier(
                      services.babel.types.identifier(i),
                      services.babel.types.identifier(i)
                    )
                  ),
                  services.babel.types.stringLiteral(source)
                )
              : null
          );
        }
      });

      if (remaining === 0) {
        // Replace wildcard reexport with named reexports
        services.babel.traverse(ast, {
          ExportAllDeclaration(path) {
            const replacement = replacements.get(path.node);
            if (replacement) {
              path.replaceWith(replacement);
            } else {
              path.remove();
            }
          },
        });

        next(action);
      }
    };

    // Resolve modules
    next({
      type: 'resolveImports',
      entrypoint: action.entrypoint,
      imports: new Map(reexportsFrom.map((i) => [i.source, []])),
      stack: action.stack,
      callback: (resolvedImports) => {
        findExportsInFiles(services, action, next, resolvedImports, onResolved);
      },
    });

    return;
  }

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
