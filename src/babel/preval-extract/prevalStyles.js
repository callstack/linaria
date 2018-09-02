/* @flow */

import { resolve } from 'path';
import generate from 'babel-generator';
import shortHash from 'short-hash';

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

function getMinifiedClassName(className: string) {
  return `ln${shortHash(className)}`;
}

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

  const overrides = process.env.LINARIA_BABEL_PRESET_OVERRIDES || '';

  let parsed;

  try {
    parsed = JSON.parse(overrides || '{}');
  } catch (e) {
    parsed = null;
  }

  // Avoid writing css from the dependencies
  // We should only write the CSS for the file the user ran through Babel
  process.env.LINARIA_BABEL_PRESET_OVERRIDES = JSON.stringify({
    ...parsed,
    extract: false,
  });

  const { exports: className } = instantiateModule(
    replacement,
    resolve(state.filename)
  );

  // Restore the plugin options
  process.env.LINARIA_BABEL_PRESET_OVERRIDES = overrides;

  const { minifyClassnames } = state.opts;

  return babel.types.stringLiteral(
    minifyClassnames ? getMinifiedClassName(className) : className
  );
}
