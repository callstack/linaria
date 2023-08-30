import type { TransformOptions } from '@babel/core';
import type { File } from '@babel/types';

import type { Debugger } from '@linaria/logger';
import type { Evaluator, StrictOptions } from '@linaria/utils';

import type { StackOfMaps } from './helpers/StackOfMaps';
import type { Services } from './types';

export interface IEntrypointCode {
  ast: File;
  code: string;
  evalConfig: TransformOptions;
  evaluator: Evaluator;
}

export interface IEvaluatedEntrypoint {
  evaluated: true;
  evaluatedOnly: string[];
  exportsValues: StackOfMaps<string | symbol, unknown>;
  generation: number;
  ignored: false;
  log: Debugger;
  only: string[];
}

export interface IIgnoredEntrypoint {
  code?: string;
  evaluator: 'ignored';
  reason: 'extension' | 'rule';
}

export interface IEntrypointDependency {
  only: string[];
  resolved: string | null;
  source: string;
}

export type LoadAndParseFn = (
  services: Services,
  name: string,
  loadedCode: string | undefined,
  log: Debugger,
  pluginOptions: StrictOptions
) => IEntrypointCode | IIgnoredEntrypoint;
