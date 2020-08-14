import type { Import } from '@babel/types';
import type { NodePath } from '@babel/traverse';
import syntax from '@babel/plugin-syntax-dynamic-import';
import type { Visitor } from '@babel/traverse';
import { Core } from './babel';

export default function dynamic({
  types: t,
}: Core): { inherits: any; visitor: Visitor } {
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
