/* @flow */

import type {
  BabelTypes,
  NodePath,
  BabelTaggedTemplateExpression,
} from './types';

/**
 * const header = css`
 *   color: ${header.color};
 * `;
 *
 * const header = preval`
 *   module.exports = css`
 *     color: ${header.color}
 *   `;
 * `;
 */

export default function(
  t: BabelTypes,
  path: NodePath<BabelTaggedTemplateExpression>,
  requirements: string
) {
  const titile = path.parent.id.name;

  const replacement = `
  require('babel-register')();
  require('babel-polyfill');
  ${requirements}
  module.exports = ${path.getSource().replace('css', `css.named('${titile}')`)};
  `;

  /* $FlowFixMe */
  path.node.tag.name = 'preval';
  path.node.quasi.quasis[0].value.cooked = replacement;
  path.node.quasi.quasis[0].value.raw = replacement;
  path.node.quasi.quasis = [path.node.quasi.quasis[0]];
  path.node.quasi.expressions = [];
}
