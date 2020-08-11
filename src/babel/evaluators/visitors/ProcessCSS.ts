/**
 * This visitor replaces css tag with the generated className
 *
 */

import type { NodePath } from '@babel/traverse';
import type { TaggedTemplateExpression } from '@babel/types';
import getLinariaComment from '../../utils/getLinariaComment';
import { Core } from '../../babel';

export default function ProcessCSS(
  { types: t }: Core,
  path: NodePath<TaggedTemplateExpression>
) {
  if (t.isIdentifier(path.node.tag) && path.node.tag.name === 'css') {
    const [, , className] = getLinariaComment(path);
    if (!className) {
      return;
    }

    path.replaceWith(t.stringLiteral(className));
  }
}
