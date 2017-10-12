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
  isTagAssignedToAVariable,
  isExcluded,
  isInlineStyles,
} from './validators';
import { getSelfBinding } from './utils';
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
            path.container.tokens.findIndex(
              token =>
                token.type === 'CommentBlock' &&
                token.value.includes('linaria-preval')
            ) > -1;
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
          let title: string;
          let isInlined: boolean = false;
          let inlineProperty: string;
          if (!isTagAssignedToAVariable(path) && !isInlineStyles(path)) {
            throw path.buildCodeFrameError(
              "Linaria's template literals must be assigned to a variable"
            );
          } else if (isInlineStyles(path)) {
            isInlined = true;
            const namedParentPath = path.findParent(
              parentPath =>
                // $FlowFixMe
                parentPath.isJSXOpeningElement() ||
                // $FlowFixMe
                parentPath.isObjectProperty()
            );
            inlineProperty = namedParentPath.isObjectProperty()
              ? 'value'
              : 'expression';
            title = path.scope.generateUidIdentifier(
              // $FlowFixMe
              namedParentPath
                ? (namedParentPath.node.key || namedParentPath.node.name).name
                : null
            ).name;
          } else {
            title = path.parent.id.name;
          }

          state.foundLinariaTaggedLiterals = true;

          const requirements: RequirementSource[] = [];
          path.traverse(cssTaggedTemplateRequirementsVisitor, {
            requirements,
            types,
          });

          const classNameStringLiteral = prevalStyles(
            babel,
            title,
            path,
            state,
            requirements
          );
          debugger;

          if (isInlined) {
            path.parentPath.node[inlineProperty] = classNameStringLiteral;

            classNameStringLiteral.leadingComments = [
              {
                type: 'CommentBlock',
                value: 'linaria-output',
              },
            ];
          } else {
            path.parentPath.node.init = classNameStringLiteral;

            const variableDeclarationPath = path.findParent(
              babel.types.isVariableDeclaration
            );

            variableDeclarationPath.node.leadingComments = [
              {
                type: 'CommentBlock',
                value: 'linaria-output',
              },
            ];
          }
        }
      },
    },
  };
};
