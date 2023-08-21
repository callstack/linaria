import type { TransformOptions } from '@babel/core';
import type { File } from '@babel/types';

import type { Debugger } from '@linaria/logger';
import type { Evaluator } from '@linaria/utils';

export interface IEntrypointCode {
  ast: File;
  code: string;
  evalConfig: TransformOptions;
  evaluator: Evaluator;
}

export type LoadAndParseFn<TServices, TPluginOptions> = (
  services: TServices,
  name: string,
  loadedCode: string | undefined,
  log: Debugger,
  pluginOptions: TPluginOptions
) => IEntrypointCode | 'ignored';
