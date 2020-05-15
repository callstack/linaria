/**
 * This visitor replaces css tag with the generated className
 *
 */

import { NodePath } from '@babel/traverse';
import { types as t } from '@babel/core';
import getLinariaComment from '../../utils/getLinariaComment';

export default function ProcessCSS(path: NodePath<t.TaggedTemplateExpression>) {
  if (t.isIdentifier(path.node.tag) && path.node.tag.name === 'css') {
    const [, , className] = getLinariaComment(path);
    if (!className) {
      return;
    }

    path.replaceWith(t.stringLiteral(className));
  }
}
