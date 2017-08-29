/* @flow */

import type { BabelTypes, NodePath, BabelVariableDeclarator } from '../types';

type State = {
  shouldSkip: boolean,
};

const linariaImportRegex = /linaria(?!\/build)/;

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
      if (
        !state.shouldSkip &&
        linariaImportRegex.test(path.node.source.value)
      ) {
        path.node.source.value = `${path.node.source
          .value}/build/index.runtime.js`.replace(/\/\//g, '/');
      }
    },
    VariableDeclarator(
      path: NodePath<BabelVariableDeclarator<any>>,
      state: State
    ) {
      if (
        !state.shouldSkip &&
        types.isCallExpression(path.node.init) &&
        path.node.init.callee.name === 'require' &&
        linariaImportRegex.test(path.node.init.arguments[0].value)
      ) {
        // @TODO: it's very tricky to implement this for require
        throw path.buildCodeFrameError(
          "Linaria's rewire-imports plugin does not support require calls yet"
        );
      }
    },
  },
});
