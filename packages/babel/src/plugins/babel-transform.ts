import type { BabelFile, PluginObj } from '@babel/core';
import type { NodePath } from '@babel/traverse';

import { debug } from '@linaria/logger';
import type { StrictOptions } from '@linaria/utils';
import { removeWithRelated, syncAcquire } from '@linaria/utils';

import type { Core } from '../babel';
import { TransformCacheCollection } from '../cache';
import { prepareForEvalSync } from '../transform-stages/1-prepare-for-eval';
import evalStage from '../transform-stages/2-eval';
import type { IPluginState } from '../types';
import { createEntryPoint } from '../utils/createEntryPoint';
import processTemplateExpression from '../utils/processTemplateExpression';
import withLinariaMetadata from '../utils/withLinariaMetadata';

export default function collector(
  babel: Core,
  options: StrictOptions
): PluginObj<IPluginState> {
  const cache = new TransformCacheCollection();

  return {
    name: '@linaria/babel/babel-transform',
    pre(file: BabelFile) {
      debug('babel-transform:start', file.opts.filename);

      const entryPoint = createEntryPoint(file.opts.filename!, file.code);

      const prepareStageResults = prepareForEvalSync(
        babel,
        cache,
        syncAcquire,
        entryPoint,
        {
          root: file.opts.root ?? undefined,
          pluginOptions: options,
        }
      );

      if (
        !prepareStageResults ||
        prepareStageResults.every((r) => !withLinariaMetadata(r.metadata))
      ) {
        return;
      }

      const evalStageResult = evalStage(
        cache,
        prepareStageResults.map((r) => r.code),
        {
          filename: file.opts.filename!,
          pluginOptions: options,
        }
      );

      if (evalStageResult === null) {
        return;
      }

      const [valueCache] = evalStageResult;

      file.path.traverse({
        // TODO: process transformed literals
        Identifier: (p) => {
          processTemplateExpression(p, file.opts, options, (processor) => {
            processor.build(valueCache);

            processor.doRuntimeReplacement();
          });
        },
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
