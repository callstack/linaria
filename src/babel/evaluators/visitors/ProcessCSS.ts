/**
 * This visitor replaces css tag with the generated className
 *
 */

import { types as t } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import type { TaggedTemplateExpression } from '@babel/types';
import getLinariaComment from '../../utils/getLinariaComment';

export default function ProcessCSS(path: NodePath<TaggedTemplateExpression>) {
  if (t.isIdentifier(path.node.tag) && path.node.tag.name === 'css') {
    const [, , className] = getLinariaComment(path);
    if (!className) {
      return;
    }

    path.replaceWith(t.stringLiteral(className));
  }
}
