import type { TransformOptions } from '@babel/core';
import type { File } from '@babel/types';

import type { Debugger } from '@linaria/logger';
import type { Evaluator, StrictOptions } from '@linaria/utils';

import type { Services } from './types';

export interface IEntrypointCode {
  ast: File;
  code: string;
  evalConfig: TransformOptions;
  evaluator: Evaluator;
}

export type LoadAndParseFn = (
  services: Services,
  name: string,
  loadedCode: string | undefined,
  log: Debugger,
  pluginOptions: StrictOptions
) => IEntrypointCode | 'ignored';
