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

export type EventEmitters<TEvents extends Record<string, unknown[]>> = {
  [K in keyof TEvents]: (...args: TEvents[K]) => void;
};

export type EventsHandlers<TEvents extends Record<string, unknown[]>> = {
  [K in keyof TEvents]?: Array<(...args: TEvents[K]) => void>;
};

export type ActionOn<TEvents extends Record<string, unknown[]>> = <
  K extends keyof TEvents
>(
  type: K,
  callback: (...args: TEvents[K]) => void
) => void;

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
  TEvents extends Record<string, unknown[]> = Record<never, unknown[]>
> extends IBaseNode {
  abortSignal: AbortSignal | null;
  callbacks?: EventsHandlers<TEvents>;
  entrypoint: TEntrypoint;
  on: ActionOn<TEvents>;
}

export type DataOf<TNode extends ActionQueueItem> = Omit<
  TNode,
  keyof IBaseAction | 'entrypoint'
>;

export type Handler<
  TServices extends IBaseServices,
  TAction extends IBaseAction,
  TRes
> = (
  services: TServices,
  action: TAction,
  next: Next,
  callbacks: EventEmitters<
    TAction extends IBaseAction<IBaseEntrypoint, infer TEvents>
      ? TEvents
      : Record<never, unknown[]>
  >
) => TRes;

export type Next = <TType extends ActionQueueItem['type']>(
  type: TType,
  entrypoint: IBaseEntrypoint,
  data: DataOf<Extract<ActionQueueItem, { type: TType }>>,
  abortSignal?: AbortSignal | null
) => Extract<ActionQueueItem, { type: TType }>;

export interface IExplodeReexportsAction extends IBaseAction<IEntrypoint> {
  type: 'explodeReexports';
}

export interface IProcessEntrypointAction<
  TEntrypoint extends IBaseEntrypoint = IBaseEntrypoint
> extends IBaseAction<TEntrypoint> {
  type: 'processEntrypoint';
}

export interface ITransformAction
  extends IBaseAction<
    IEntrypoint,
    {
      done: [];
    }
  > {
  type: 'transform';
}

export interface IAddToCodeCacheAction
  extends IBaseAction<
    IBaseEntrypoint,
    {
      done: [];
    }
  > {
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
  resolved: string;
}

export interface IResolveImportsAction
  extends IBaseAction<
    IBaseEntrypoint,
    {
      resolve: [result: IResolvedImport[]];
    }
  > {
  type: 'resolveImports';
  imports: Map<string, string[]> | null;
}

export interface IProcessImportsAction extends IBaseAction<IEntrypoint> {
  type: 'processImports';
  resolved: IResolvedImport[];
}

export interface IGetExportsAction
  extends IBaseAction<
    IEntrypoint,
    {
      resolve: [exports: string[]];
    }
  > {
  type: 'getExports';
}

export type ActionQueueItem =
  | IAddToCodeCacheAction
  | IExplodeReexportsAction
  | IProcessEntrypointAction
  | IProcessImportsAction
  | IResolveImportsAction
  | IGetExportsAction
  | ITransformAction;
