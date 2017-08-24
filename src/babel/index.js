/* @flow */

import type {
  BabelTypes,
  NodePath,
  State,
  BabelTaggedTemplateExpression,
} from './types';

import {
  shouldTraverseExtrnalIds,
  isLinariaTaggedTemplate,
  ensureTagIsAssignedToAVariable,
  isExcluded,
} from './validators';
import { getSelfBinding } from './utils';
import buildPrevaltemplate from './buildPrevalTemplate';
import resolveSource from './resolveSource';
import extractStyles from './extractStyles';

const externalRequirementsVisitor = {
  Identifier(path) {
    if (path.isReferenced() && getSelfBinding(path) && !isExcluded(path)) {
      const source: ?string = resolveSource(path);
      if (source && !this.requirements.find(item => item === source)) {
        this.requirements.splice(this.addBeforeIndex, 0, source);
        const binding = getSelfBinding(path);
        if (shouldTraverseExtrnalIds(binding.path)) {
          binding.path.traverse(externalRequirementsVisitor, this);
        }
      }
    }
  },
};

const cssTaggedTemplateRequirementsVisitor = {
  Identifier(path) {
    if (path.isReferenced() && !isExcluded(path)) {
      const source: ?string = resolveSource(path);
      if (source && !this.requirements.find(item => item === source)) {
        this.requirements.push(source);
        this.addBeforeIndex = this.requirements.length - 1;
        const binding = getSelfBinding(path);
        if (shouldTraverseExtrnalIds(binding.path)) {
          binding.path.traverse(externalRequirementsVisitor, this);
        }
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
        path.traverse(cssTaggedTemplateRequirementsVisitor, {
          requirements,
        });

        buildPrevaltemplate(types, path, state, requirements.join('\n'));
      }
    },
  },
});
