import type { NodePath } from '@babel/traverse';
import type { Identifier } from '@babel/types';

import type { BaseProcessor, IFileContext } from '@linaria/tags';
import type { StrictOptions } from '@linaria/utils';

import getTagProcessor from './getTagProcessor';

const processed = new WeakSet<Identifier>();

export const processTemplateExpression = (
  p: NodePath<Identifier>,
  fileContext: IFileContext,
  options: Pick<
    StrictOptions,
    'classNameSlug' | 'displayName' | 'evaluate' | 'tagResolver'
  >,
  emit: (processor: BaseProcessor) => void
) => {
  if (p.parentPath.isExportSpecifier()) return;
  if (processed.has(p.node)) return;

  const tagProcessor = getTagProcessor(p, fileContext, options);

  processed.add(p.node);

  if (tagProcessor === null) return;

  emit(tagProcessor);
};
