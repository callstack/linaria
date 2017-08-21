/* @flow */

import type {
  BabelTypes,
  NodePath,
  State,
  BabelTaggedTemplateExpression,
} from './types';

import buildPrevaltemplate from './buildPrevalTemplate';
import { isExcluded, resolveSource } from './sourceResolvers';
import extractStyles from './extractStyles';

function isLinariaTaggedTemplate(
  types: BabelTypes,
  path: NodePath<BabelTaggedTemplateExpression<any>>
): boolean {
  if (
    (types.isIdentifier(path.node.tag) && path.node.tag.name === 'css') ||
    (types.isCallExpression(path.node.tag) &&
      types.isMemberExpression(path.node.tag.callee) &&
      path.node.tag.callee.object.name === 'css' &&
      path.node.tag.callee.property.name === 'named')
  ) {
    return true;
  }

  if (
    types.isMemberExpression(path.node.tag) &&
    path.node.tag.object.name === 'css' &&
    path.node.tag.property.name === 'named'
  ) {
    throw new Error("Linaria's `css.named` must be called with a classname");
  }

  return false;
}

function ensureTagIsAssignedToAVariable(
  path: NodePath<BabelTaggedTemplateExpression<any>>
) {
  const parent = path.parentPath;
  if (!parent.isVariableDeclarator()) {
    throw path.buildCodeFrameError(
      "Linaria's template literals must be assigned to a variable"
    );
  }
}

const requirementsVisitor = {
  Identifier(path) {
    if (path.isReferenced() && !isExcluded(path)) {
      const source: ?string = resolveSource(path);
      if (source && !this.requirements.find(item => item === source)) {
        this.requirements.push(source);
      }
    }
  },
};

export default ({ types }: { types: BabelTypes }) => ({
  visitor: {
    Program: {
      enter(path: NodePath<*>, state: State) {
        state.skipFile =
          // $FlowFixMe
          path.container.comments.length &&
          path.container.comments[0].value.includes('linaria-preval');
        state.foundLinariaTaggedLiterals = false;
        state.filename = state.file.opts.filename;
      },
      exit(path: NodePath<*>, state: State) {
        if (state.skipFile) {
          return;
        }

        if (state.foundLinariaTaggedLiterals) {
          extractStyles(types, path, state.filename, state.opts);
        }
      },
    },
    TaggedTemplateExpression(
      path: NodePath<BabelTaggedTemplateExpression<any>>,
      state: State
    ) {
      if (!state.skipFile && isLinariaTaggedTemplate(types, path)) {
        ensureTagIsAssignedToAVariable(path);

        state.foundLinariaTaggedLiterals = true;

        const requirements = [];
        path.traverse(requirementsVisitor, {
          requirements,
        });

        buildPrevaltemplate(types, path, state, requirements.join('\n'));
      }
    },
  },
});
