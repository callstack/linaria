import { NodePath } from '@babel/traverse';
import { types } from '@babel/core';
import TaggedTemplateExpression from '../visitors/TaggedTemplateExpression';
import JSXElement from '../visitors/JSXElement';
import CallExpression from '../visitors/CallExpression';
import { State, StrictOptions } from '../types';
import CSSTemplateExpression from '../visitors/CSSTemplateExpression';
import ImportDeclaration from '../visitors/ImportDeclaration';

function preeval(_babel: any, options: StrictOptions) {
  return {
    visitor: {
      Program: {
        enter(path: NodePath<types.Program>, state: State) {
          // Collect all the style rules from the styles we encounter
          state.queue = [];
          state.rules = {};
          state.index = -1;
          state.dependencies = [];
          state.replacements = [];

          // We need our transforms to run before anything else
          // So we traverse here instead of a in a visitor
          path.traverse({
            ImportDeclaration: p => ImportDeclaration(p, state),
            TaggedTemplateExpression: p =>
              TaggedTemplateExpression(p, state, options),

            JSXElement,
          });
        },
      },
      CallExpression,
      TaggedTemplateExpression: CSSTemplateExpression,
    },
  };
}

export default function preset(context: any, options: StrictOptions) {
  return {
    plugins: [[preeval, options]],
  };
}
