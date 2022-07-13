// @ts-expect-error
import syntax from '@babel/plugin-syntax-dynamic-import';
import type { NodePath, Visitor } from '@babel/traverse';
import type { Import } from '@babel/types';

import type { Core } from '../babel';

export default function dynamic({ types: t }: Core): {
  inherits: unknown;
  visitor: Visitor;
} {
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
