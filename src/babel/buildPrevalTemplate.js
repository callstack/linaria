/* @flow */

import type {
  BabelTypes,
  State,
  NodePath,
  BabelTaggedTemplateExpression,
  BabelIdentifier,
  BabelCallExpression,
} from './types';

/**
 * const header = css`
 *   color: ${header.color};
 * `;
 *
 * const header = preval`
 *   module.exports = css.named('header_slug')`
 *     color: ${header.color}
 *   `;
 * `;
 */

export default function(
  t: BabelTypes,
  path: NodePath<
    BabelTaggedTemplateExpression<BabelIdentifier | BabelCallExpression>
  >,
  state: State,
  requirements: string
) {
  const titile = path.parent.id.name;
  const env = process.env.BABEL_ENV || process.env.NODE_ENV;

  const replacement = `
  /* linaria-preval */

  import '${require.resolve('./register')}';
  ${requirements}
  module.exports = ${path
    .getSource()
    .replace(
      /css(?!\.named)/g,
      env === 'production'
        ? `css.named('${titile}')`
        : `css.named('${titile}', '${state.filename}')`
    )}
  `;

  /* $FlowFixMe */
  path.node.tag.name = 'preval';
  path.node.quasi.quasis[0].value.cooked = replacement;
  path.node.quasi.quasis[0].value.raw = replacement;
  path.node.quasi.quasis = [path.node.quasi.quasis[0]];
  path.node.quasi.expressions = [];
}
