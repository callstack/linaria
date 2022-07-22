/**
 * This file is a babel preset used to transform files inside evaluators.
 * It works the same as main `babel/extract` preset, but do not evaluate lazy dependencies.
 */
import type { BabelFile, NodePath, PluginObj } from '@babel/core';
import type { Identifier } from '@babel/types';

import { createCustomDebug } from '@linaria/logger';
import type { StrictOptions } from '@linaria/utils';
import {
  collectExportsAndImports,
  getFileIdx,
  JSXElementsRemover,
  removeWithRelated,
} from '@linaria/utils';

import type { Core } from '../babel';
import type { IPluginState } from '../types';
import processTemplateExpression from '../utils/processTemplateExpression';

export type PreevalOptions = Pick<
  StrictOptions,
  'classNameSlug' | 'displayName' | 'evaluate'
>;

const isGlobal = (id: NodePath<Identifier>): boolean => {
  const { scope } = id;
  const { name } = id.node;
  return !scope.hasBinding(name) && scope.hasGlobal(name);
};

const forbiddenGlobals = new Set([
  'XMLHttpRequest',
  'clearImmediate',
  'clearInterval',
  'clearTimeout',
  'document',
  'fetch',
  'localStorage',
  'location',
  'navigator',
  'sessionStorage',
  'setImmediate',
  'setInterval',
  'setTimeout',
  'window',
]);

const isBrowserGlobal = (id: NodePath<Identifier>) => {
  return forbiddenGlobals.has(id.node.name) && isGlobal(id);
};

export default function preeval(
  babel: Core,
  options: PreevalOptions
): PluginObj<IPluginState> {
  const { types: t } = babel;
  return {
    name: '@linaria/babel/preeval',
    pre(file: BabelFile) {
      const log = createCustomDebug('preeval', getFileIdx(file.opts.filename!));

      log('start', 'Looking for template literals…');

      const { imports } = collectExportsAndImports(
        file.path,
        file.opts.filename
      );

      const jsxRuntime = imports.find((i) => i.source === 'react/jsx-runtime');
      const jsxRuntimeName =
        jsxRuntime?.local?.isIdentifier() && jsxRuntime?.local?.node?.name;

      this.processors = [];

      file.path.traverse({
        Identifier: (p) => {
          processTemplateExpression(p, file.opts, options, (processor) => {
            processor.doEvaltimeReplacement();
            this.processors.push(processor);
          });
        },
      });

      log('start', 'Strip all JSX and browser related stuff');
      file.path.traverse({
        // JSX can be replaced with a dummy value,
        // but we have to do it after we processed template tags.
        CallExpression: {
          enter(p) {
            if (!jsxRuntimeName) return;
            const callee = p.get('callee');
            if (callee.isIdentifier({ name: jsxRuntimeName })) {
              JSXElementsRemover(p);
            }
          },
        },
        JSXElement: {
          enter: JSXElementsRemover,
        },
        JSXFragment: {
          enter: JSXElementsRemover,
        },
        Identifier(p) {
          if (isBrowserGlobal(p)) {
            if (p.parentPath.isUnaryExpression({ operator: 'typeof' })) {
              // Ignore `typeof window` expressions
              return;
            }

            removeWithRelated([p]);
          }
        },
      });
    },
    visitor: {},
    post(file: BabelFile) {
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

      const expressions: Identifier[] = this.processors.flatMap((processor) =>
        processor.dependencies.map((dependency) => dependency.ex)
      );

      const linariaPreval = file.path.scope.getData('__linariaPreval');
      if (!linariaPreval) {
        const linariaExport = t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.memberExpression(
              t.identifier('exports'),
              t.identifier('__linariaPreval')
            ),
            t.objectExpression(
              expressions.map((ex) => t.objectProperty(ex, ex, false, true))
            )
          )
        );

        file.path.pushContainer('body', linariaExport);
      }

      log('end', '__linariaPreval has been added');
    },
  };
}
