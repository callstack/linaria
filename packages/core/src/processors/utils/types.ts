import type { TransformOptions } from '@babel/core';

import type { ClassNameFn } from '@linaria/utils';

export interface IOptions {
  classNameSlug?: string | ClassNameFn;
  displayName: boolean;
}

export type IFileContext = Pick<TransformOptions, 'root' | 'filename'>;
