/**
 * This file is a babel preset used to transform files inside evaluators.
 * It works the same as main `babel/extract` preset, but do not evaluate lazy dependencies.
 */
import type { BabelFile, PluginObj } from '@babel/core';

import { createCustomDebug } from '@linaria/logger';
import type { StrictOptions } from '@linaria/utils';
import {
  EventEmitter,
  getFileIdx,
  addIdentifierToLinariaPreval,
  removeDangerousCode,
  isFeatureEnabled,
} from '@linaria/utils';

import type { Core } from '../babel';
import type { IPluginState } from '../types';
import { processTemplateExpression } from '../utils/processTemplateExpression';

export type PreevalOptions = Pick<
  StrictOptions,
  'classNameSlug' | 'displayName' | 'evaluate' | 'features'
> & { eventEmitter: EventEmitter };

const onFinishCallbacks = new WeakMap<object, () => void>();

export default function preeval(
  babel: Core,
  { eventEmitter = EventEmitter.dummy, ...options }: PreevalOptions
): PluginObj<IPluginState & { onFinish: () => void }> {
  const { types: t } = babel;
  return {
    name: '@linaria/babel/preeval',
    pre(file: BabelFile) {
      const filename = file.opts.filename!;
      const log = createCustomDebug('preeval', getFileIdx(filename));

      log('start', 'Looking for template literals…');

      const rootScope = file.scope;
      this.processors = [];

      const onProcessTemplateFinished = eventEmitter.pair({
        method: 'preeval:processTemplate',
      });

      file.path.traverse({
        Identifier: (p) => {
          processTemplateExpression(p, file.opts, options, (processor) => {
            processor.dependencies.forEach((dependency) => {
              if (dependency.ex.type === 'Identifier') {
                addIdentifierToLinariaPreval(rootScope, dependency.ex.name);
              }
            });

            processor.doEvaltimeReplacement();
            this.processors.push(processor);
          });
        },
      });

      onProcessTemplateFinished();

      if (
        isFeatureEnabled(options.features, 'dangerousCodeRemover', filename)
      ) {
        log('start', 'Strip all JSX and browser related stuff');
        const onCodeRemovingFinished = eventEmitter.pair({
          method: 'preeval:removeDangerousCode',
        });
        removeDangerousCode(file.path);
        onCodeRemovingFinished();
      }

      onFinishCallbacks.set(
        this,
        eventEmitter.pair({ method: 'preeval:rest-transformations' })
      );
    },
    visitor: {},
    post(file: BabelFile) {
      onFinishCallbacks.get(this)?.();

      const log = createCustomDebug('preeval', getFileIdx(file.opts.filename!));

      if (this.processors.length === 0) {
        log('end', "We didn't find any Linaria template literals");

        // We didn't find any Linaria template literals.
        return;
      }

      this.file.metadata.linaria = {
        processors: this.processors,
        replacements: [],
        rules: {},
        dependencies: [],
      };

      const linariaPreval = file.path.scope.getData('__linariaPreval');
      if (!linariaPreval) {
        // Event if there is no dependencies, we still need to add __linariaPreval
        const linariaExport = t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.memberExpression(
              t.identifier('exports'),
              t.identifier('__linariaPreval')
            ),
            t.objectExpression([])
          )
        );

        file.path.pushContainer('body', linariaExport);
      }

      log('end', '__linariaPreval has been added');
    },
  };
}
