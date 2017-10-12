/* @flow */

import { resolve } from 'path';

import type {
  BabelCore,
  State,
  NodePath,
  BabelTaggedTemplateExpression,
  BabelIdentifier,
  BabelCallExpression,
  RequirementSource,
} from '../types';

import getReplacement from './getReplacement';
import {
  instantiateModule,
  clearLocalModulesFromCache,
} from '../lib/moduleSystem';

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
  babel: BabelCore,
  title: string,
  path: NodePath<
    BabelTaggedTemplateExpression<BabelIdentifier | BabelCallExpression>
  >,
  state: State,
  requirements: RequirementSource[]
) {
  const env = process.env.NODE_ENV || process.env.BABEL_ENV;

  const replacement = getReplacement([
    ...requirements,
    {
      code: `module.exports = ${path
        .getSource()
        .replace(
          /css(?!\.named)/g,
          env === 'production'
            ? `css.named('${title}')`
            : `css.named('${title}', '${state.filename}')`
        )}`,
      loc: path.node.loc.start,
    },
  ]);

  clearLocalModulesFromCache();
  const { exports: className } = instantiateModule(
    replacement,
    resolve(state.filename)
  );

  return babel.types.stringLiteral(className);
}
