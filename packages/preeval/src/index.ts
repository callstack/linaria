/**
 * This file is a babel preset used to transform files inside evaluators.
 * It works the same as main `babel/extract` preset, but do not evaluate lazy dependencies.
 */
import type { NodePath } from '@babel/traverse';
import type { Program } from '@babel/types';
import type { State, StrictOptions } from '@linaria/babel';
import {
  GenerateClassNames,
  DetectStyledImportName,
  JSXElement,
  ProcessStyled,
  ProcessCSS,
} from '@linaria/babel';
import { Core } from './babel';

function index(babel: Core, options: StrictOptions) {
  return {
    visitor: {
      Program: {
        enter(path: NodePath<Program>, state: State) {
          // Collect all the style rules from the styles we encounter
          state.queue = [];
          state.rules = {};
          state.index = -1;
          state.dependencies = [];
          state.replacements = [];

          // We need our transforms to run before anything else
          // So we traverse here instead of a in a visitor
          path.traverse({
            ImportDeclaration: (p) => DetectStyledImportName(babel, p, state),
            TaggedTemplateExpression: (p) =>
              GenerateClassNames(babel, p, state, options),
            JSXElement,
          });
        },
      },
      CallExpression: ProcessStyled,
      TaggedTemplateExpression: ProcessCSS, // TaggedTemplateExpression is processed before CallExpression
    },
  };
}

export default function preset(context: any, options: StrictOptions) {
  return {
    plugins: [[index, options]],
  };
}
