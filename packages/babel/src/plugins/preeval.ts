/**
 * Preeval finds all template literals, applies corresponding template processors,
 * and adds metadata to the file.
 */
import type { BabelFile } from '@babel/core';

import { createCustomDebug } from '@linaria/logger';
import type { LinariaMetadata, StrictOptions } from '@linaria/utils';
import { getFileIdx, getOrAddLinariaPreval } from '@linaria/utils';

import type { Core } from '../babel';
import { findAndProcessTemplateExpressions } from '../utils/processTemplateExpression';

export type PreevalOptions = Pick<
  StrictOptions,
  'classNameSlug' | 'displayName' | 'evaluate' | 'tagResolver'
>;

export default function preeval(
  { types: t }: Core,
  options: PreevalOptions,
  file: BabelFile
): LinariaMetadata | undefined {
  const log = createCustomDebug('preeval', getFileIdx(file.opts.filename!));

  log('start', 'Looking for template literals…');

  const processors = findAndProcessTemplateExpressions(file, options);

  if (processors.length === 0) {
    log('end', "We didn't find any Linaria template literals");

    // We didn't find any Linaria template literals.
    return undefined;
  }

  getOrAddLinariaPreval(file.path.scope);
  log('end', '__linariaPreval has been added');

  return {
    processors,
    replacements: [],
    rules: {},
    dependencies: [],
  };
}
