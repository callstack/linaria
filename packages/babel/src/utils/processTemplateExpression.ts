import type { NodePath } from '@babel/traverse';
import type { TaggedTemplateExpression } from '@babel/types';

import type { State, StrictOptions } from '../types';

import getTagProcessor from './getTagProcessor';

const processTemplateExpression = (
  p: NodePath<TaggedTemplateExpression>,
  state: State,
  options: StrictOptions
) => {
  const tagProcessor = getTagProcessor(p, state, options);
  if (tagProcessor === null) return;

  state.processors.push(tagProcessor);
};

export default processTemplateExpression;
