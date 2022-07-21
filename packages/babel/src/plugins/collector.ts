/**
 * Collector traverses the AST and collects information about imports and
 * all Linaria template literals.
 */

import type { BabelFile, PluginObj } from '@babel/core';
import type { NodePath } from '@babel/traverse';

import { debug } from '@linaria/logger';
import type { StrictOptions } from '@linaria/utils';
import { removeWithRelated } from '@linaria/utils';

import type { Core } from '../babel';
import type { IPluginState, ValueCache } from '../types';
import processTemplateExpression from '../utils/processTemplateExpression';

export default function collector(
  babel: Core,
  options: StrictOptions & { values?: ValueCache }
): PluginObj<IPluginState> {
  const values = options.values ?? new Map<string, unknown>();
  return {
    name: '@linaria/babel/collector',
    pre(file: BabelFile) {
      debug('collect:start', file.opts.filename);

      this.processors = [];

      file.path.traverse({
        // TODO: process transformed literals
        Identifier: (p) => {
          processTemplateExpression(p, file.opts, options, (processor) => {
            processor.build(values);

            processor.doRuntimeReplacement();
            this.processors.push(processor);
          });
        },
      });
    },
    visitor: {},
    post(file: BabelFile) {
      if (this.processors.length === 0) {
        // We didn't find any Linaria template literals.
        return;
      }

      this.file.metadata.linaria = {
        processors: this.processors,
        replacements: [],
        rules: {},
        dependencies: [],
      };

      // We can remove __linariaPreval export and all related code
      const prevalExport = (
        file.path.scope.getData('__linariaPreval') as NodePath | undefined
      )?.findParent((p) => p.isExpressionStatement());
      if (prevalExport) {
        removeWithRelated([prevalExport]);
      }

      debug('collect:end', file.opts.filename);
    },
  };
}
