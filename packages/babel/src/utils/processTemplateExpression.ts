import type { NodePath } from '@babel/traverse';
import type { TaggedTemplateExpression } from '@babel/types';

import type { BaseProcessor, IFileContext } from '@linaria/tags';
import type { StrictOptions } from '@linaria/utils';

import getTagProcessor from './getTagProcessor';

const processTemplateExpression = (
  p: NodePath<TaggedTemplateExpression>,
  fileContext: IFileContext,
  options: Pick<
    StrictOptions,
    'classNameSlug' | 'displayName' | 'evaluate' | 'tagResolver'
  >,
  emit: (processor: BaseProcessor) => void
) => {
  const tagProcessor = getTagProcessor(p, fileContext, options);
  if (tagProcessor === null) return;

  emit(tagProcessor);
};

export default processTemplateExpression;
