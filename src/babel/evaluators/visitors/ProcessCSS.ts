/**
 * This visitor replaces css tag with the generated className
 *
 */

import { NodePath } from '@babel/traverse';
import { types as t } from '@babel/core';
import { getLinariaComment } from '../../utils/linariaComment';
import { expression } from '@babel/template';

const collectComposeFnName = '__linariaCollectCompose';

const linariaCSSTpl = expression(
  `{
    displayName: %%displayName%%,
    __linaria: {
      className: %%className%%,
      type: 'css',
      composes: %%composes%%,
    },
    toString() {
      return className
    }
  }`
);

export default function ProcessCSS(path: NodePath<t.TaggedTemplateExpression>) {
  if (t.isIdentifier(path.node.tag) && path.node.tag.name === 'css') {
    const [slug, displayName, className] = getLinariaComment(path);
    if (!slug) {
      return;
    }

    // replace `css` with `__linariaCollectCompose` to be able to process nested interpolations in VM
    const originalTaggedTemplateExpression = t.cloneNode(path.node);
    originalTaggedTemplateExpression.tag = t.identifier(collectComposeFnName);
    const callExpr = t.callExpression(originalTaggedTemplateExpression, [
      t.stringLiteral(className || ''),
    ]);

    path.replaceWith(
      linariaCSSTpl({
        displayName: displayName ? t.stringLiteral(displayName) : null,
        className: className ? t.stringLiteral(className) : null,
        composes: callExpr,
      })
    );
  }
}
