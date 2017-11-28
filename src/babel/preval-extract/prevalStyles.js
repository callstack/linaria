/* @flow */

import { resolve } from 'path';
import generate from 'babel-generator';

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
  const { name } = path.scope.generateUidIdentifier(title);
  const source = path.getSource() || generate(path.node).code;

  const replacement = getReplacement([
    ...requirements,
    {
      code: `module.exports = ${source
        .replace(/css(?!\.named)/g, `css.named('${name}', '${state.filename}')`)
        .replace(
          /css\.named\(([^,]+)\)/,
          (input, customName) => `css.named(${customName}, '${state.filename}')`
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
