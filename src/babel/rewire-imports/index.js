/* @flow */

import type { BabelTypes, NodePath } from '../types';

type State = {
  shouldSkip: boolean,
};

function getReplacement(value) {
  return `${value}/build/index.runtime.js`.replace(/\/\//g, '/');
}

function isLinariaImport(value) {
  try {
    return require.resolve(value) === require.resolve('linaria');
  } catch (e) {
    /* istanbul ignore next */
    return false;
  }
}

export default ({ types }: { types: BabelTypes }) => ({
  visitor: {
    Program: {
      enter(path: NodePath<any>, state: State) {
        state.shouldSkip =
          // $FlowFixMe
          path.container.comments.length &&
          path.container.comments[0].value.includes('linaria-preval');
      },
    },
    ImportDeclaration(path: NodePath<any>, state: State) {
      if (!state.shouldSkip && isLinariaImport(path.node.source.value)) {
        path.node.source.value = getReplacement(path.node.source.value);
      }
    },
    CallExpression(path: NodePath<any>, state: State) {
      if (
        !state.shouldSkip &&
        path.node.callee.name === 'require' &&
        path.node.arguments.length === 1
      ) {
        const argument = path.node.arguments[0];

        if (types.isStringLiteral(argument)) {
          if (isLinariaImport(argument.value)) {
            argument.value = getReplacement(argument.value);
          }
        } else if (types.isConditionalExpression(argument)) {
          if (
            types.isStringLiteral(argument.consequent) &&
            isLinariaImport(argument.consequent.value)
          ) {
            argument.consequent.value = getReplacement(
              argument.consequent.value
            );
          }

          if (
            types.isStringLiteral(argument.alternate) &&
            isLinariaImport(argument.alternate.value)
          ) {
            argument.alternate.value = getReplacement(argument.alternate.value);
          }
        }
      }
    },
  },
});
