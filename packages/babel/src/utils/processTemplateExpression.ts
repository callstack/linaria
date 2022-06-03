import type { NodePath } from '@babel/traverse';
import type { TaggedTemplateExpression } from '@babel/types';

import type { Core } from '../babel';
import type { State, StrictOptions } from '../types';

import collectTemplateDependencies from './collectTemplateDependencies';
import getTagProcessor from './getTagProcessor';

const processTemplateExpression = (
  babel: Core,
  stage: 'extract' | 'preeval',
  p: NodePath<TaggedTemplateExpression>,
  state: State,
  options: StrictOptions
) => {
  const tagProcessor = getTagProcessor(p, state, options);
  if (tagProcessor === null) return;

  if (stage === 'extract') {
    const [quasis, expressions] = collectTemplateDependencies(
      babel,
      p,
      state,
      options
    );

    state.queue.push({
      path: p,
      quasis,
      expressions,
      dependencies: tagProcessor.dependencies,
    });
  }
};

export default processTemplateExpression;
