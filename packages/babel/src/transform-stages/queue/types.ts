import type { TransformOptions } from '@babel/core';
import type { File } from '@babel/types';

import type { Evaluator, StrictOptions, EventEmitter } from '@linaria/utils';

import type { Core } from '../../babel';
import type { TransformCacheCollection } from '../../cache';
import type {
  IBaseEntrypoint,
  ITransformFileResult,
  Options,
} from '../../types';

export type Services = {
  babel: Core;
  cache: TransformCacheCollection;
  options: Pick<Options, 'root' | 'inputSourceMap'>;
  eventEmitter: EventEmitter;
};

export interface IBaseNode {
  type: ActionQueueItem['type'];
}

export interface IEntrypointCode {
  ast: File;
  code: string;
  evalConfig: TransformOptions;
  evaluator: Evaluator;
}

export interface IEntrypoint<TPluginOptions = StrictOptions>
  extends IBaseEntrypoint,
    IEntrypointCode {
  pluginOptions: TPluginOptions;
}

export type ActionByType<TType extends ActionQueueItem['type']> = Extract<
  ActionQueueItem,
  {
    type: TType;
  }
>;

export interface IBaseServices {
  eventEmitter: EventEmitter;
}

export interface IBaseAction<
  TEntrypoint extends IBaseEntrypoint = IBaseEntrypoint,
  TResult = unknown
> extends IBaseNode {
  abortSignal: AbortSignal | null;
  entrypoint: TEntrypoint;
  idx: string;
  result?: TResult;
}

export type DataOf<TNode extends ActionQueueItem> = Omit<
  TNode,
  keyof IBaseAction | 'entrypoint'
>;

export type Handler<
  TServices extends IBaseServices,
  TAction extends IBaseAction,
  TRes extends AnyActionGenerator
> = (services: TServices, action: TAction) => TRes;

type NextParams<TType extends ActionQueueItem['type']> = [
  type: TType,
  entrypoint: IBaseEntrypoint,
  data: DataOf<Extract<ActionQueueItem, { type: TType }>>,
  abortSignal?: AbortSignal | null,
  needResult?: boolean
];

export type Next = <TType extends ActionQueueItem['type']>(
  ...args: NextParams<TType>
) => Extract<ActionQueueItem, { type: TType }>;

export type YieldNext = {
  [K in ActionQueueItem['type']]: NextParams<K>;
}[ActionQueueItem['type']];

export type ActionGenerator<TAction extends IBaseAction> = Generator<
  YieldNext,
  TAction extends IBaseAction<IBaseEntrypoint, infer TResult> ? TResult : never,
  never
>;

export type AsyncActionGenerator<TAction extends IBaseAction> = AsyncGenerator<
  YieldNext,
  TAction extends IBaseAction<IBaseEntrypoint, infer TResult> ? TResult : never,
  never
>;

export type AnyActionGenerator<TAction extends IBaseAction = ActionQueueItem> =
  | ActionGenerator<TAction>
  | AsyncActionGenerator<TAction>;

export type GetGeneratorForRes<
  TRes extends Promise<void> | void,
  TAction extends IBaseAction
> = TRes extends Promise<void>
  ? AnyActionGenerator<TAction>
  : ActionGenerator<TAction>;

export type Continuation<TAction extends IBaseAction = ActionQueueItem> = {
  abortSignal: AbortSignal | null;
  action: TAction;
  generator: AnyActionGenerator<TAction>;
  resultFrom?: [entrypoint: IBaseEntrypoint, actionKey: string];
  uid: string;
  weight: number;
};

export interface IExplodeReexportsAction
  extends IBaseAction<IEntrypoint, void> {
  type: 'explodeReexports';
}

export interface IProcessEntrypointAction<
  TEntrypoint extends IBaseEntrypoint = IBaseEntrypoint
> extends IBaseAction<TEntrypoint, void> {
  type: 'processEntrypoint';
}

export interface ITransformAction extends IBaseAction<IEntrypoint, void> {
  type: 'transform';
}

export interface IAddToCodeCacheAction extends IBaseAction<IEntrypoint, void> {
  type: 'addToCodeCache';
  data: {
    imports: Map<string, string[]> | null;
    only: string[];
    result: ITransformFileResult;
  };
}

export interface IFinalizeEntrypointAction
  extends IBaseAction<IEntrypoint, void> {
  type: 'finalizeEntrypoint';
  finalizer: () => void;
}

export interface IResolvedImport {
  importedFile: string;
  importsOnly: string[];
  resolved: string;
}

export interface IResolveImportsAction
  extends IBaseAction<IBaseEntrypoint, IResolvedImport[]> {
  type: 'resolveImports';
  imports: Map<string, string[]> | null;
}

export interface IProcessImportsAction extends IBaseAction<IEntrypoint, void> {
  type: 'processImports';
  resolved: IResolvedImport[];
}

export interface IGetExportsAction extends IBaseAction<IEntrypoint, string[]> {
  type: 'getExports';
}

export type ActionQueueItem =
  | IAddToCodeCacheAction
  | IExplodeReexportsAction
  | IFinalizeEntrypointAction
  | IProcessEntrypointAction
  | IProcessImportsAction
  | IResolveImportsAction
  | IGetExportsAction
  | ITransformAction;
