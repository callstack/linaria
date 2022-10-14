import { types as t } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import type {
  CallExpression,
  Function as FunctionNode,
  JSX,
} from '@babel/types';

import { getScope } from '../getScope';
import { mutate } from '../scopeHelpers';

function getFunctionName(path: NodePath<FunctionNode>): string | null {
  if (path.isClassMethod() && t.isIdentifier(path.node.key)) {
    return path.node.key.name;
  }

  return null;
}

export default function JSXElementsRemover(
  path: NodePath<JSX | CallExpression>
) {
  // JSX can be safely replaced with null because it is unnecessary for styles
  const nullLiteral = t.nullLiteral();

  // We can do even more
  // If that JSX is a result of a function, we can replace the function body.
  const functionScope = getScope(path).getFunctionParent();
  const scopePath = functionScope?.path;
  if (scopePath?.isFunction()) {
    const emptyBody = t.blockStatement([t.returnStatement(nullLiteral)]);

    // Is it not just a function, but a method `render`?
    if (getFunctionName(scopePath) === 'render') {
      const decl = scopePath.findParent((p) => p.isClassDeclaration());

      // Replace the whole component
      if (decl?.isClassDeclaration()) {
        mutate(decl, (p) => {
          p.replaceWith(t.functionDeclaration(decl.node.id, [], emptyBody));
        });

        return;
      }
    }

    const body = scopePath.get('body');
    if (Array.isArray(body)) {
      throw new Error(
        "A body of a function is expected to be a single element but an array was returned. It's possible if JS syntax has been changed since that code was written."
      );
    }

    const node: typeof scopePath.node = {
      ...scopePath.node,
      body: emptyBody,
      params: [],
    };

    mutate(scopePath, (p) => {
      p.replaceWith(node);
    });
  } else {
    mutate(path, (p) => {
      p.replaceWith(nullLiteral);
    });
  }
}
