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
  path: NodePath<BabelTaggedTemplateExpression>
): boolean {
  // $FlowFixMe
  return path.node.tag && path.node.tag.name === 'css';
}

function ensureTagIsAssignedToAVariable(
  path: NodePath<BabelTaggedTemplateExpression>
) {
  const parent = path.parentPath;
  if (!parent.isVariableDeclarator()) {
    throw new Error(
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

export default ({ types: t }: { types: BabelTypes }) => ({
  visitor: {
    Program: {
      enter(path: NodePath<*>, state: State) {
        state.filename = state.file.opts.filename;
      },
      exit() {
        extractStyles();
      },
    },
    TaggedTemplateExpression(path: NodePath<BabelTaggedTemplateExpression>) {
      if (isLinariaTaggedTemplate(path)) {
        ensureTagIsAssignedToAVariable(path);

        const programPath = path.findParent(item => item.isProgram());
        const requirements = [];
        programPath.traverse(requirementsVisitor, {
          requirements,
        });

        buildPrevaltemplate(t, path, requirements.join('\n'));
      }
    },
  },
});
