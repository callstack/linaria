import type { BabelFile, PluginObj } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import type { Identifier } from '@babel/types';

import { debug } from '@linaria/logger';
import { removeWithRelated, syncResolve } from '@linaria/utils';

import type { Core } from '../babel';
import { TransformCacheCollection } from '../cache';
import { prepareForEvalSync } from '../transform-stages/1-prepare-for-eval';
import evalStage from '../transform-stages/2-eval';
import type { PluginOptions } from '../transform-stages/helpers/loadLinariaOptions';
import loadLinariaOptions from '../transform-stages/helpers/loadLinariaOptions';
import type { IPluginState } from '../types';
import { processTemplateExpression } from '../utils/processTemplateExpression';
import withLinariaMetadata from '../utils/withLinariaMetadata';

export default function collector(
  babel: Core,
  options: Partial<PluginOptions>
): PluginObj<IPluginState> {
  const cache = new TransformCacheCollection();

  return {
    name: '@linaria/babel/babel-transform',
    pre(file: BabelFile) {
      debug('babel-transform:start', file.opts.filename);

      const entrypoint = {
        name: file.opts.filename!,
        code: file.code,
        only: ['__linariaPreval'],
      };

      const pluginOptions = loadLinariaOptions(options);

      const prepareStageResult = prepareForEvalSync(
        babel,
        cache,
        syncResolve,
        entrypoint,
        pluginOptions,
        {
          root: file.opts.root ?? undefined,
          inputSourceMap: file.opts.inputSourceMap ?? undefined,
        }
      );

      if (
        !prepareStageResult ||
        !withLinariaMetadata(prepareStageResult?.metadata)
      ) {
        return;
      }

      const evalStageResult = evalStage(
        cache,
        prepareStageResult.code,
        pluginOptions,
        file.opts.filename!
      );

      if (evalStageResult === null) {
        return;
      }

      const [valueCache] = evalStageResult;

      const identifiers: NodePath<Identifier>[] = [];
      file.path.traverse({
        Identifier: (p) => {
          identifiers.push(p);
        },
      });
      identifiers.forEach((p) => {
        processTemplateExpression(p, file.opts, pluginOptions, (processor) => {
          processor.build(valueCache);
          processor.doRuntimeReplacement();
        });
      });

      // We can remove __linariaPreval export and all related code
      const prevalExport = (
        file.path.scope.getData('__linariaPreval') as NodePath | undefined
      )?.findParent((p) => p.isExpressionStatement());
      if (prevalExport) {
        removeWithRelated([prevalExport]);
      }
    },
    visitor: {},
    post(file: BabelFile) {
      debug('babel-transform:end', file.opts.filename);
    },
  };
}
