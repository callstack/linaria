/**
 * This file is a babel preset used to transform files inside evaluators.
 * It works the same as main `babel/extract` preset, but do not evaluate lazy dependencies.
 */
import type { NodePath } from '@babel/traverse';
import type { Program } from '@babel/types';
import GenerateClassNames from '../visitors/GenerateClassNames';
import DetectStyledImportName from '../visitors/DetectStyledImportName';
import type { State, StrictOptions } from '../types';
import { Core } from '../babel';
import JSXElement from './visitors/JSXElement';
import ProcessStyled from './visitors/ProcessStyled';
import ProcessCSS from './visitors/ProcessCSS';

function preeval(babel: Core, options: StrictOptions) {
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
    plugins: [[preeval, options]],
  };
}
