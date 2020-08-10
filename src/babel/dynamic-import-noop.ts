import { types as t } from '@babel/core';
import type { Import } from '@babel/types';
import type { NodePath } from '@babel/traverse';
import syntax from '@babel/plugin-syntax-dynamic-import';

export default function dynamic() {
  return {
    inherits: syntax,
    visitor: {
      Import(path: NodePath<Import>) {
        const noop = t.arrowFunctionExpression([], t.identifier('undefined'));

        path.parentPath.replaceWith(
          t.objectExpression([
            t.objectProperty(t.identifier('then'), noop),
            t.objectProperty(t.identifier('catch'), noop),
          ])
        );
      },
    },
  };
}
