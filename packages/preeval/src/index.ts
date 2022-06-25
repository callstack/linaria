/* eslint-disable no-param-reassign */
/**
 * This file is a babel preset used to transform files inside evaluators.
 * It works the same as main `babel/extract` preset, but do not evaluate lazy dependencies.
 */
import type { NodePath } from '@babel/traverse';
import type { Program, Statement, VariableDeclaration } from '@babel/types';

import type { State, StrictOptions } from '@linaria/babel-preset';
import { JSXElement, processTemplateExpression } from '@linaria/babel-preset';

import type { Core } from './babel';

const isHoistableExport = (
  node: NodePath<Statement>
): node is NodePath<Statement> & NodePath<VariableDeclaration> => {
  // Only `var` can be hoisted
  if (!node.isVariableDeclaration({ kind: 'var' })) return false;

  const declarations = node.get('declarations');

  // Our target has only one declaration
  if (!Array.isArray(declarations) || declarations.length !== 1) return false;

  const init = declarations[0].get('init');
  // It should be initialized with CallExpression…
  if (!init || Array.isArray(init) || !init.isCallExpression()) return false;

  const callee = init.get('callee');
  // … which callee should be `required` …
  if (Array.isArray(callee) || !callee.isIdentifier({ name: 'require' }))
    return false;

  // … which should be a global identifier
  return !callee.scope.hasReference('require');
};

function index(babel: Core, options: StrictOptions) {
  return {
    visitor: {
      Program: {
        enter(path: NodePath<Program>, state: State) {
          // Collect all the style rules from the styles we encounter
          state.processors = [];

          // We need our transforms to run before anything else
          // So we traverse here instead of a in a visitor
          path.traverse({
            TaggedTemplateExpression: (p) => {
              processTemplateExpression(p, state, options);
            },
            JSXElement,
          });
        },
        exit(path: NodePath<Program>) {
          /* A really dirty hack that solves https://github.com/callstack/linaria/issues/800
           * Sometimes babel inserts `require` after usages of required modules.
           * It makes the shaker sad. As a temporary solution, we hoist requires.
           * This hack should be deleted after transition `shaker` to @babel/traverse
           */
          path
            .get('body')
            .filter(isHoistableExport)
            .forEach((p) => {
              const { node } = p;
              p.remove();
              path.unshiftContainer('body', node);
            });
        },
      },
    },
  };
}

export default function preset(context: unknown, options: StrictOptions) {
  return {
    plugins: [[index, options]],
  };
}
