import type { BabelFileResult } from '@babel/core';

import type { Debugger } from '@linaria/logger';
import type { ValueCache } from '@linaria/tags';
import type {
  EventEmitter,
  Artifact,
  LinariaMetadata,
  StrictOptions,
} from '@linaria/utils';

import type { Core } from '../babel';
import type { TransformCacheCollection } from '../cache';
import type { Options, ITransformFileResult } from '../types';

import type { Entrypoint } from './Entrypoint';
import type { LoadAndParseFn, IEntrypointDependency } from './Entrypoint.types';
import type { BaseAction } from './actions/BaseAction';
import type {
  IExtracted,
  IWorkflowActionLinariaResult,
  IWorkflowActionNonLinariaResult,
} from './actions/types';

export type Services = {
  babel: Core;
  cache: TransformCacheCollection;
  eventEmitter: EventEmitter;
  loadAndParseFn: LoadAndParseFn;
  log: Debugger;
  options: Options & {
    pluginOptions: StrictOptions;
  };
};

export interface IBaseNode {
  type: ActionTypes;
}

export type ActionByType<TType extends ActionQueueItem['type']> = Extract<
  ActionQueueItem,
  {
    type: TType;
  }
>;

export const Pending = Symbol('pending');

export type YieldResult = Exclude<ActionQueueItem['result'], typeof Pending>;

export type AnyIteratorResult<TMode extends 'async' | 'sync', TResult> = {
  async: Promise<IteratorResult<YieldArg, TResult>>;
  sync: IteratorResult<YieldArg, TResult>;
}[TMode];

export interface IBaseAction<TAction extends ActionQueueItem, TResult, TData>
  extends IBaseNode {
  abortSignal: AbortSignal | null;
  createAbortSignal: () => AbortSignal & Disposable;
  data: TData;
  entrypoint: Entrypoint;
  getNext: GetNext;
  idx: string;
  result: TResult | typeof Pending;
  run: <TMode extends 'async' | 'sync'>(
    handler: Handler<TMode, TAction>
  ) => {
    next: (arg: YieldResult) => AnyIteratorResult<TMode, TResult>;
    throw(e: unknown): AnyIteratorResult<TMode, TResult>;
  };
  services: Services;
}

type NextParams<
  TType extends ActionTypes,
  TNextAction extends ActionByType<TType> = ActionByType<TType>,
> = [
  type: TType,
  entrypoint: Entrypoint,
  data: TNextAction['data'],
  abortSignal?: AbortSignal | null,
];

export type YieldArg = {
  [K in ActionQueueItem['type']]: NextParams<K>;
}[ActionQueueItem['type']];

export type SyncScenarioFor<TResult> = {
  [Symbol.iterator](): SyncScenarioFor<TResult>;
  next(arg: YieldResult): IteratorResult<YieldArg, TResult>;
  return(value: TResult): IteratorResult<YieldArg, TResult>;
  throw(e: unknown): IteratorResult<YieldArg, TResult>;
};

export type AsyncScenarioFor<TResult> = {
  [Symbol.asyncIterator](): AsyncScenarioFor<TResult>;
  next(arg: YieldResult): Promise<IteratorResult<YieldArg, TResult>>;
  return(
    value: TResult | PromiseLike<TResult>
  ): Promise<IteratorResult<YieldArg, TResult>>;
  throw(e: unknown): Promise<IteratorResult<YieldArg, TResult>>;
};

export type SyncScenarioForAction<TAction extends ActionQueueItem> =
  SyncScenarioFor<TypeOfResult<TAction>>;

export type AsyncScenarioForAction<TAction extends ActionQueueItem> =
  AsyncScenarioFor<TypeOfResult<TAction>>;

export type Handler<
  TMode extends 'async' | 'sync',
  TAction extends ActionQueueItem,
> = ((this: BaseAction<TAction>) => {
  async: AsyncScenarioForAction<TAction>;
  sync: SyncScenarioForAction<TAction>;
}[TMode]) & {
  recover?: (e: unknown, action: BaseAction<TAction>) => YieldArg;
};

export type Handlers<TMode extends 'async' | 'sync'> = {
  [TAction in ActionQueueItem as TAction['type']]: Handler<TMode, TAction>;
};

export type TypeOfResult<T extends ActionQueueItem> = Exclude<
  T['result'],
  typeof Pending
>;

export type GetNext = <
  TType extends ActionTypes,
  TNextAction extends ActionByType<TType> = ActionByType<TType>,
>(
  ...args: NextParams<TType, TNextAction>
) => Generator<
  [TType, Entrypoint, TNextAction['data'], AbortSignal | null],
  TypeOfResult<TNextAction>,
  YieldResult
>;

export interface ICollectActionResult {
  ast: BabelFileResult['ast']; // FIXME: looks like this is not used
  code: BabelFileResult['code'];
  map?: BabelFileResult['map'];
  metadata?: LinariaMetadata | null;
}

export interface ICollectAction
  extends IBaseAction<
    ICollectAction,
    ICollectActionResult,
    { valueCache: ValueCache }
  > {
  type: 'collect';
}

export interface IEvalAction
  extends IBaseAction<IEvalAction, [ValueCache, string[]] | null, undefined> {
  type: 'evalFile';
}

export interface IExplodeReexportsAction
  extends IBaseAction<IExplodeReexportsAction, void, undefined> {
  type: 'explodeReexports';
}

export interface IExtractAction
  extends IBaseAction<
    IExtractAction,
    IExtracted,
    { processors: { artifacts: Artifact[] }[] }
  > {
  type: 'extract';
}

export interface IGetExportsAction
  extends IBaseAction<IGetExportsAction, string[], undefined> {
  type: 'getExports';
}

export interface IProcessEntrypointAction
  extends IBaseAction<IProcessEntrypointAction, void, undefined> {
  type: 'processEntrypoint';
}

export interface IProcessImportsAction
  extends IBaseAction<
    IProcessImportsAction,
    void,
    {
      resolved: IEntrypointDependency[];
    }
  > {
  type: 'processImports';
}

export interface IResolveImportsAction
  extends IBaseAction<
    IResolveImportsAction,
    IEntrypointDependency[],
    {
      imports: Map<string, string[]> | null;
    }
  > {
  type: 'resolveImports';
}

export interface ITransformAction
  extends IBaseAction<ITransformAction, ITransformFileResult, undefined> {
  type: 'transform';
}

export interface IWorkflowAction
  extends IBaseAction<
    IWorkflowAction,
    IWorkflowActionLinariaResult | IWorkflowActionNonLinariaResult,
    undefined
  > {
  type: 'workflow';
}

export type ActionQueueItem =
  | IEvalAction
  | IExplodeReexportsAction
  | IExtractAction
  | IGetExportsAction
  | ICollectAction
  | IProcessEntrypointAction
  | IProcessImportsAction
  | IResolveImportsAction
  | ITransformAction
  | IWorkflowAction;

export type ActionTypes = ActionQueueItem['type'];
