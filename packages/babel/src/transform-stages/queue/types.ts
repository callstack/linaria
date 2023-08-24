import type { BabelFileResult } from '@babel/core';

import type { Debugger } from '@linaria/logger';
import type { ValueCache } from '@linaria/tags';
import type { StrictOptions, EventEmitter, Artifact } from '@linaria/utils';

import type { Core } from '../../babel';
import type { TransformCacheCollection } from '../../cache';
import type {
  IBaseEntrypoint,
  ITransformFileResult,
  Options,
} from '../../types';

import type { Entrypoint } from './Entrypoint';
import type { IEntrypointCode, LoadAndParseFn } from './Entrypoint.types';
import type {
  IExtracted,
  IResolvedImport,
  IWorkflowActionLinariaResult,
  IWorkflowActionNonLinariaResult,
} from './actions/types';

export type Services = {
  babel: Core;
  cache: TransformCacheCollection;
  loadAndParseFn: LoadAndParseFn;
  log: Debugger;
  options: Options;
  eventEmitter: EventEmitter;
};

export interface IBaseNode {
  type: ActionTypes;
}

export interface IEntrypoint extends IBaseEntrypoint, IEntrypointCode {
  pluginOptions: StrictOptions;
}

export type ActionByType<
  TMode extends 'async' | 'sync',
  TType extends ActionQueueItem<TMode>['type'],
> = Extract<
  ActionQueueItem<TMode>,
  {
    type: TType;
  }
>;

export interface IBaseServices {
  eventEmitter: EventEmitter;
}

export const Pending = Symbol('pending');

// export type AnyGenerator<TNext, TResult, TNextResults> =
//   | Generator<TNext, TResult, TNextResults>
//   | AsyncGenerator<TNext, TResult, TNextResults>;

// export type AnyActionGenerator<
//   TAction extends ActionQueueItem = ActionQueueItem,
// > = AnyGenerator<YieldArg, TAction['result'], YieldResult>;

// export type SyncActionGenerator<
//   TAction extends ActionQueueItem = ActionQueueItem,
// > = Generator<YieldArg, TAction['result'], YieldResult>;

export type YieldResult<TMode extends 'async' | 'sync'> = Exclude<
  ActionQueueItem<TMode>['result'],
  typeof Pending
>;

export type AnyIteratorResult<TMode extends 'async' | 'sync', TResult> = {
  async: Promise<IteratorResult<YieldArg<TMode>, TResult>>;
  sync: IteratorResult<YieldArg<TMode>, TResult>;
}[TMode];

export interface IBaseAction<TMode extends 'async' | 'sync', TResult, TData>
  extends IBaseNode {
  abortSignal: AbortSignal | null;
  data: TData;
  entrypoint: Entrypoint<TMode>;
  getNext: GetNext<TMode>;
  idx: string;
  mode: TMode;
  result: TResult | typeof Pending;
  run: () => {
    next: (arg: YieldResult<TMode>) => AnyIteratorResult<TMode, TResult>;
  };
  services: Services;
}

type NextParams<
  TMode extends 'async' | 'sync',
  TType extends ActionTypes,
  TNextAction extends ActionByType<TMode, TType> = ActionByType<TMode, TType>,
> = [
  type: TType,
  entrypoint: Entrypoint<TMode>,
  data: TNextAction['data'],
  abortSignal?: AbortSignal | null,
];

export type YieldArg<TMode extends 'async' | 'sync'> = {
  [K in ActionQueueItem<TMode>['type']]: NextParams<TMode, K>;
}[ActionQueueItem<TMode>['type']];

export type SyncScenarioFor<TResult> = {
  next(arg: YieldResult<'sync'>): IteratorResult<YieldArg<'sync'>, TResult>;
  return(value: TResult): IteratorResult<YieldArg<'sync'>, TResult>;
  throw(e: unknown): IteratorResult<YieldArg<'sync'>, TResult>;
  [Symbol.iterator](): SyncScenarioFor<TResult>;
};

export type AsyncScenarioFor<TResult> = {
  next(
    arg: YieldResult<'async'>
  ): Promise<IteratorResult<YieldArg<'async'>, TResult>>;
  return(
    value: TResult | PromiseLike<TResult>
  ): Promise<IteratorResult<YieldArg<'async'>, TResult>>;
  throw(e: unknown): Promise<IteratorResult<YieldArg<'async'>, TResult>>;
  [Symbol.asyncIterator](): AsyncScenarioFor<TResult>;
};

export type SyncScenarioForAction<TAction extends ActionQueueItem<'sync'>> =
  SyncScenarioFor<TypeOfResult<'sync', TAction>>;

export type AsyncScenarioForAction<TAction extends ActionQueueItem<'async'>> =
  AsyncScenarioFor<TypeOfResult<'async', TAction>>;

export type ScenarioFor<
  TMode extends 'async' | 'sync',
  TResult,
> = TMode extends 'async'
  ? AsyncScenarioFor<TResult>
  : SyncScenarioFor<TResult>;

export type ScenarioForAction<
  TMode extends 'async' | 'sync',
  TAction extends ActionQueueItem<TMode>,
> = TAction extends ActionQueueItem<'sync'>
  ? SyncScenarioForAction<TAction>
  : TAction extends ActionQueueItem<'async'>
  ? AsyncScenarioForAction<TAction>
  : never;

type Handler<TType extends ActionTypes> = {
  sync: (
    this: ActionByType<'sync', TType>
  ) => SyncScenarioForAction<ActionQueueItem<'sync'>>;
  async: (
    this: ActionByType<'async', TType>
  ) => AsyncScenarioForAction<ActionQueueItem<'async'>>;
};

export type Handlers<TMode extends 'async' | 'sync'> = {
  [K in ActionQueueItem<TMode>['type']]: Handler<K>[TMode];
};

export type TypeOfResult<
  TMode extends 'async' | 'sync',
  T extends ActionQueueItem<TMode>,
> = Exclude<T['result'], typeof Pending>;

export type TypeOfData<
  TMode extends 'async' | 'sync',
  TNode extends ActionQueueItem<TMode>,
> = TNode['data'];

export type Next = <TMode extends 'async' | 'sync', TType extends ActionTypes>(
  ...args: NextParams<TMode, TType>
) => Extract<ActionQueueItem<TMode>, { type: TType }>;

export type GetNext<TMode extends 'async' | 'sync'> = <
  TType extends ActionTypes,
  TNextAction extends ActionByType<TMode, TType> = ActionByType<TMode, TType>,
>(
  ...args: NextParams<TMode, TType, TNextAction>
) => Generator<
  [TType, Entrypoint<TMode>, TNextAction['data'], AbortSignal | null],
  TypeOfResult<TMode, TNextAction>,
  YieldResult<TMode>
>;

// export type GetGeneratorForRes<
//   TMode extends 'async' | 'sync',
//   TRes extends Promise<void> | void,
//   TAction extends ActionQueueItem<TMode>,
// > = TRes extends Promise<void>
//   ? AnyActionGenerator<TAction>
//   : SyncActionGenerator<TAction>;

export type Continuation<
  TMode extends 'async' | 'sync',
  TAction extends ActionQueueItem<TMode> = ActionQueueItem<TMode>,
> = {
  abortSignal: AbortSignal | null;
  action: TAction;
  generator: ScenarioForAction<TMode, TAction>;
  resultFrom?: [entrypoint: IBaseEntrypoint, actionKey: string];
  uid: string;
  weight: number;
};

export interface IAddToCodeCacheAction<TMode extends 'async' | 'sync'>
  extends IBaseAction<
    TMode,
    void,
    {
      imports: Map<string, string[]> | null;
      only: string[];
      result: ITransformFileResult;
    }
  > {
  type: 'addToCodeCache';
}

export interface ICollectAction<TMode extends 'async' | 'sync'>
  extends IBaseAction<TMode, BabelFileResult, { valueCache: ValueCache }> {
  type: 'collect';
}

export interface IEvalAction<TMode extends 'async' | 'sync'>
  extends IBaseAction<TMode, [ValueCache, string[]] | null, { code: string }> {
  type: 'evalFile';
}

export interface IExplodeReexportsAction<TMode extends 'async' | 'sync'>
  extends IBaseAction<TMode, void, undefined> {
  type: 'explodeReexports';
}

export interface IExtractAction<TMode extends 'async' | 'sync'>
  extends IBaseAction<
    TMode,
    IExtracted,
    { processors: { artifacts: Artifact[] }[] }
  > {
  type: 'extract';
}

export interface IFinalizeEntrypointAction<TMode extends 'async' | 'sync'>
  extends IBaseAction<
    TMode,
    void,
    {
      finalizer: () => void;
    }
  > {
  type: 'finalizeEntrypoint';
}

export interface IGetExportsAction<TMode extends 'async' | 'sync'>
  extends IBaseAction<TMode, string[], undefined> {
  type: 'getExports';
}

export interface IProcessEntrypointAction<TMode extends 'async' | 'sync'>
  extends IBaseAction<TMode, void, undefined> {
  type: 'processEntrypoint';
}

export interface IProcessImportsAction<TMode extends 'async' | 'sync'>
  extends IBaseAction<
    TMode,
    void,
    {
      resolved: IResolvedImport[];
    }
  > {
  type: 'processImports';
}

export interface IResolveImportsAction<TMode extends 'async' | 'sync'>
  extends IBaseAction<
    TMode,
    IResolvedImport[],
    {
      imports: Map<string, string[]> | null;
    }
  > {
  type: 'resolveImports';
}

export interface ITransformAction<TMode extends 'async' | 'sync'>
  extends IBaseAction<TMode, void, undefined> {
  type: 'transform';
}

export interface IWorkflowAction<TMode extends 'async' | 'sync'>
  extends IBaseAction<
    TMode,
    IWorkflowActionLinariaResult | IWorkflowActionNonLinariaResult,
    undefined
  > {
  type: 'workflow';
}

export type ActionQueueItem<TMode extends 'async' | 'sync'> =
  | IAddToCodeCacheAction<TMode>
  | IEvalAction<TMode>
  | IExplodeReexportsAction<TMode>
  | IExtractAction<TMode>
  | IFinalizeEntrypointAction<TMode>
  | IGetExportsAction<TMode>
  | ICollectAction<TMode>
  | IProcessEntrypointAction<TMode>
  | IProcessImportsAction<TMode>
  | IResolveImportsAction<TMode>
  | ITransformAction<TMode>
  | IWorkflowAction<TMode>;

export type ActionTypes = ActionQueueItem<'async' | 'sync'>['type'];
