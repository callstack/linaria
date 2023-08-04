import type { TransformOptions } from '@babel/core';
import type { File } from '@babel/types';

import type { Debugger } from '@linaria/logger';
import type { Evaluator, StrictOptions, EventEmitter } from '@linaria/utils';

import type { Core } from '../../babel';
import type { TransformCacheCollection } from '../../cache';
import type { ITransformFileResult, Options } from '../../types';

import type { IBaseNode } from './PriorityQueue';

export type Services = {
  babel: Core;
  cache: TransformCacheCollection;
  options: Pick<Options, 'root' | 'inputSourceMap'>;
  eventEmitter: EventEmitter;
};

export interface IEntrypoint {
  abortSignal?: AbortSignal;
  ast: File;
  code: string;
  evalConfig: TransformOptions;
  evaluator: Evaluator;
  log: Debugger;
  name: string;
  only: string[];
  pluginOptions: StrictOptions;
}

export interface IProcessEntrypointAction extends IBaseNode {
  type: 'processEntrypoint';
}

export interface ITransformAction extends IBaseNode {
  type: 'transform';
}

export interface IAddToCodeCacheAction extends IBaseNode {
  type: 'addToCodeCache';
  data: {
    imports: Map<string, string[]> | null;
    only: string[];
    result: ITransformFileResult;
  };
}

export interface IResolvedImport {
  importedFile: string;
  importsOnly: string[];
  resolved: string | null;
}

export interface IResolveImportsAction extends IBaseNode {
  callback: (resolved: IResolvedImport[]) => void;
  imports: Map<string, string[]> | null;
  type: 'resolveImports';
}

export interface IProcessImportsAction extends IBaseNode {
  resolved: IResolvedImport[];
  type: 'processImports';
}

export interface IGetExportsAction extends IBaseNode {
  callback: (exports: string[]) => void;
  type: 'getExports';
}

export type ActionQueueItem =
  | IAddToCodeCacheAction
  | IProcessEntrypointAction
  | IProcessImportsAction
  | IResolveImportsAction
  | IGetExportsAction
  | ITransformAction;
