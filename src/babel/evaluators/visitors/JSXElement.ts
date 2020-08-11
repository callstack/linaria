import { NodePath } from '@babel/traverse';
import { types } from '@babel/core';

function getFunctionName(path: NodePath<types.Function>): string | null {
  if (path.isClassMethod() && types.isIdentifier(path.node.key)) {
    return path.node.key.name;
  }

  return null;
}

export default function JSXElement(path: NodePath<types.JSXElement>) {
  // JSX can be safely replaced on an empty fragment because it is unnecessary for styles
  const emptyFragment = types.jsxFragment(
    types.jsxOpeningFragment(),
    types.jsxClosingFragment(),
    []
  );

  // We can do even more
  // If that JSX is a result of a function, we can replace the function body.
  const scopePath = path.scope.path;
  if (scopePath.isFunction()) {
    const emptyBody = types.blockStatement([
      types.returnStatement(emptyFragment),
    ]);

    // Is it not just a function, but a method `render`?
    if (getFunctionName(scopePath) === 'render') {
      const decl = scopePath.findParent((p) => p.isClassDeclaration());

      // Replace the whole component
      if (decl?.isClassDeclaration()) {
        decl.replaceWith(
          types.functionDeclaration(decl.node.id, [], emptyBody)
        );

        return;
      }
    }

    scopePath.get('body').replaceWith(emptyBody);
  } else {
    path.replaceWith(emptyFragment);
  }
}
