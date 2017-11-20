/* @flow */

import type {
  BabelCore,
  BabelTypes,
  NodePath,
  State,
  BabelTaggedTemplateExpression,
  BabelIdentifier,
  RequirementSource,
} from '../types';

import {
  shouldTraverseExternalIds,
  isLinariaTaggedTemplate,
  isExcluded,
} from './validators';
import { getSelfBinding, relativeToCwd } from './utils';
import prevalStyles from './prevalStyles';
import resolveSource from './resolveSource';
import extractStyles from './extractStyles';

export const externalRequirementsVisitor = {
  Identifier(path: NodePath<BabelIdentifier>) {
    if (path.isReferenced() && getSelfBinding(path) && !isExcluded(path)) {
      const source: ?RequirementSource = resolveSource(this.types, path);
      if (
        source &&
        !this.requirements.find(item => item.code === source.code)
      ) {
        this.requirements.splice(this.addBeforeIndex, 0, source);
        const binding = getSelfBinding(path);
        if (shouldTraverseExternalIds(binding.path)) {
          binding.path.traverse(externalRequirementsVisitor, this);
        }
      }
    }
  },
};

export const cssTaggedTemplateRequirementsVisitor = {
  Identifier(path: NodePath<BabelIdentifier>) {
    if (path.isReferenced() && !isExcluded(path)) {
      const source: ?RequirementSource = resolveSource(this.types, path);
      if (
        source &&
        !this.requirements.find(item => item.code === source.code)
      ) {
        this.requirements.push(source);
        this.addBeforeIndex = this.requirements.length - 1;
        const binding = getSelfBinding(path);
        if (shouldTraverseExternalIds(binding.path)) {
          binding.path.traverse(externalRequirementsVisitor, this);
        }
      }
    }
  },
};

export default (babel: BabelCore) => {
  const { types }: { types: BabelTypes } = babel;

  return {
    visitor: {
      Program: {
        enter(path: NodePath<*>, state: State) {
          state.skipFile =
            // $FlowFixMe
            path.container.tokens.some(
              token =>
                token.type === 'CommentBlock' &&
                token.value.trim() === 'linaria-preval'
            );
          state.foundLinariaTaggedLiterals = false;
          state.filename = relativeToCwd(state.file.opts.filename);
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
          let title;

          const parent = path.findParent(
            p =>
              types.isObjectProperty(p) ||
              types.isJSXOpeningElement(p) ||
              types.isVariableDeclarator(p)
          );

          if (parent) {
            if (types.isObjectProperty(parent)) {
              title = parent.node.key.name || parent.node.key.value;
            } else if (types.isJSXOpeningElement(parent)) {
              title = parent.node.name.name;
            } else if (types.isVariableDeclarator(parent)) {
              title = parent.node.id.name;
            }
          }

          if (!title) {
            throw path.buildCodeFrameError(
              "Couldn't determine the class name for CSS template literal. Ensure that it's either:\n" +
                '- Assigned to a variable\n' +
                '- Is an object property\n' +
                '- Is a prop in a JSX element\n'
            );
          }

          state.foundLinariaTaggedLiterals = true;

          const requirements: RequirementSource[] = [];

          path.traverse(cssTaggedTemplateRequirementsVisitor, {
            requirements,
            types,
          });

          const className = prevalStyles(
            babel,
            title,
            path,
            state,
            requirements
          );

          path.replaceWith(className);
          path.addComment('leading', 'linaria-output');
        }
      },
    },
  };
};
