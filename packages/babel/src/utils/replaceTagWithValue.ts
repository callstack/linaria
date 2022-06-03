/**
 * This visitor replaces tag with the generated value
 *
 */

import type { NodePath } from '@babel/traverse';
import type { TaggedTemplateExpression } from '@babel/types';

import type { State, StrictOptions } from '../types';

import getTagProcessor from './getTagProcessor';

export default function replaceTagWithValue(
  path: NodePath<TaggedTemplateExpression>,
  state: State,
  options: Pick<StrictOptions, 'classNameSlug' | 'displayName'>
) {
  const tagProcessor = getTagProcessor(path, state, options);
  if (!tagProcessor) return;

  path.replaceWithSourceString(tagProcessor.valueSource);
}
