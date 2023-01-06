import type { TransformOptions } from '@babel/core';

import type { ClassNameFn, VariableNameFn } from '@linaria/utils';

export interface IOptions {
  classNameSlug?: string | ClassNameFn;
  displayName: boolean;
  variableNameConfig?: 'var' | 'dashes' | 'raw';
  variableNameSlug?: string | VariableNameFn;
}

export type IFileContext = Pick<TransformOptions, 'root' | 'filename'>;
