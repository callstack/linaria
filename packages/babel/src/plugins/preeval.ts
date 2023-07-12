/**
 * This file is a babel preset used to transform files inside evaluators.
 * It works the same as main `babel/extract` preset, but do not evaluate lazy dependencies.
 */
import type { BabelFile, NodePath, PluginObj } from '@babel/core';
import type { Identifier } from '@babel/types';

import { createCustomDebug } from '@linaria/logger';
import type { StrictOptions } from '@linaria/utils';
import {
  JSXElementsRemover,
  getFileIdx,
  isUnnecessaryReactCall,
  nonType,
  removeWithRelated,
  addIdentifierToLinariaPreval,
} from '@linaria/utils';

import type { Core } from '../babel';
import type { IPluginState } from '../types';
import processTemplateExpression from '../utils/processTemplateExpression';

export type PreevalOptions = Pick<
  StrictOptions,
  'classNameSlug' | 'displayName' | 'evaluate'
>;

const isGlobal = (id: NodePath<Identifier>): boolean => {
  if (!nonType(id)) {
    return false;
  }

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

const getPropertyName = (path: NodePath): string | null => {
  if (path.isIdentifier()) {
    return path.node.name;
  }

  if (path.isStringLiteral()) {
    return path.node.value;
  }

  return null;
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

      const rootScope = file.scope;
      this.processors = [];

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

      log('start', 'Strip all JSX and browser related stuff');
      file.path.traverse(
        {
          // JSX can be replaced with a dummy value,
          // but we have to do it after we processed template tags.
          CallExpression: {
            enter(p) {
              if (isUnnecessaryReactCall(p)) {
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
          MemberExpression(p, state) {
            const obj = p.get('object');
            const prop = p.get('property');
            if (!obj.isIdentifier({ name: 'window' })) {
              return;
            }

            const name = getPropertyName(prop);
            if (!name) {
              return;
            }

            state.windowScoped.add(name);
            // eslint-disable-next-line no-param-reassign
            state.globals = state.globals.filter((id) => {
              if (id.node.name === name) {
                removeWithRelated([id]);
                return false;
              }

              return true;
            });
          },
          MetaProperty(p) {
            // Remove all references to `import.meta`
            removeWithRelated([p]);
          },
          Identifier(p, state) {
            if (p.find((parent) => parent.isTSTypeReference())) {
              // don't mess with TS type references
              return;
            }
            if (isBrowserGlobal(p)) {
              if (
                p.find(
                  (parentPath) =>
                    parentPath.isUnaryExpression({ operator: 'typeof' }) ||
                    parentPath.isTSTypeQuery()
                )
              ) {
                // Ignore `typeof window` expressions
                return;
              }

              if (p.parentPath.isClassProperty()) {
                // ignore class property decls
                return;
              }
              if (p.parentPath.isMemberExpression() && p.key === 'property') {
                // ignore e.g this.fetch()
                // window.fetch will be handled by the windowScoped block below
                return;
              }

              removeWithRelated([p]);

              return;
            }

            if (state.windowScoped.has(p.node.name)) {
              removeWithRelated([p]);
            } else if (isGlobal(p)) {
              state.globals.push(p);
            }
          },
        },
        {
          globals: [] as NodePath<Identifier>[],
          windowScoped: new Set<string>(),
        }
      );
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
