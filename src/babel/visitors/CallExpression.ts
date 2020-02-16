import { NodePath } from '@babel/traverse';
import { types } from '@babel/core';
import getLinariaComment from '../utils/getLinariaComment';
import { expression } from '@babel/template';

const linariaComponentTpl = expression(
  `{
    displayName: %%displayName%%,
    __linaria: {
      className: %%className%%,
      extends: %%extends%%
    }
  }`
);

export default function CallExpression(path: NodePath<types.CallExpression>) {
  const [, displayName, className] = getLinariaComment(path);
  if (!className) {
    return;
  }

  path.replaceWith(
    linariaComponentTpl({
      className: types.stringLiteral(className),
      displayName: displayName ? types.stringLiteral(displayName) : null,
      extends: types.isCallExpression(path.node.callee)
        ? path.node.callee.arguments[0]
        : types.nullLiteral(),
    })
  );
}
