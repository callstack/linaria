import type { TransformOptions } from '@babel/core';
import type { File } from '@babel/types';

import type { Debugger } from '@linaria/logger';
import type { Evaluator, StrictOptions, EventEmitter } from '@linaria/utils';

import type { Core } from '../../babel';
import type { TransformCacheCollection } from '../../cache';
import type { ITransformFileResult, Options } from '../../types';

import type { IBaseNode, IBaseEntrypoint } from './PriorityQueue';

export type Services = {
  babel: Core;
  cache: TransformCacheCollection;
  options: Pick<Options, 'root' | 'inputSourceMap'>;
  eventEmitter: EventEmitter;
};

export interface IEntrypoint extends IBaseEntrypoint {
  ast: File;
  code: string;
  evalConfig: TransformOptions;
  evaluator: Evaluator;
  log: Debugger;
  name: string;
  only: string[];
  pluginOptions: StrictOptions;
}

export type BaseAction<
  TEvents extends Record<string, unknown[]> = Record<never, unknown[]>
> = IBaseNode<IEntrypoint, TEvents>;

export interface IProcessEntrypointAction extends BaseAction {
  type: 'processEntrypoint';
}

export interface ITransformAction extends BaseAction {
  type: 'transform';
}

export interface IAddToCodeCacheAction extends BaseAction {
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

export interface IResolveImportsAction
  extends BaseAction<{
    resolve: [exports: IResolvedImport[]];
  }> {
  imports: Map<string, string[]> | null;
  type: 'resolveImports';
}

export interface IProcessImportsAction extends BaseAction {
  resolved: IResolvedImport[];
  type: 'processImports';
}

export interface IGetExportsAction
  extends BaseAction<{
    resolve: [exports: string[]];
  }> {
  type: 'getExports';
}

export type ActionQueueItem =
  | IAddToCodeCacheAction
  | IProcessEntrypointAction
  | IProcessImportsAction
  | IResolveImportsAction
  | IGetExportsAction
  | ITransformAction;
