import { NodePath } from '@babel/traverse';
import { types } from '@babel/core';
import getLinariaComment from '../utils/getLinariaComment';

export default function CSSTemplateExpression(
  path: NodePath<types.TaggedTemplateExpression>
) {
  if (types.isIdentifier(path.node.tag) && path.node.tag.name === 'css') {
    const [, , className] = getLinariaComment(path);
    if (!className) {
      return;
    }

    path.replaceWith(types.stringLiteral(className));
  }
}
