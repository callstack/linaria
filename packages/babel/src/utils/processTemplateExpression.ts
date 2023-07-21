import type { BabelFile } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import type { Identifier } from '@babel/types';

import type { BaseProcessor, IFileContext } from '@linaria/tags';
import type { StrictOptions } from '@linaria/utils';
import { addIdentifierToLinariaPreval } from '@linaria/utils';

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

export const findAndProcessTemplateExpressions = (
  file: BabelFile,
  options: Pick<
    StrictOptions,
    'classNameSlug' | 'displayName' | 'evaluate' | 'tagResolver'
  >
) => {
  const processors: BaseProcessor[] = [];

  const identifiers: NodePath<Identifier>[] = [];

  file.path.traverse({
    Identifier: (p) => {
      identifiers.push(p);
    },
  });

  identifiers.forEach((p) => {
    processTemplateExpression(p, file.opts, options, (processor) => {
      processor.dependencies.forEach((dependency) => {
        if (dependency.ex.type === 'Identifier') {
          addIdentifierToLinariaPreval(p.scope, dependency.ex.name);
        }
      });

      processor.doEvaltimeReplacement();
      processors.push(processor);
    });
  });

  return processors;
};

export default processTemplateExpression;
