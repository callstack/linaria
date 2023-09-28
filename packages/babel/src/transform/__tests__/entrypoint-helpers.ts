import * as babel from '@babel/core';
import type { File } from '@babel/types';

import { EventEmitter } from '@linaria/utils';

import { TransformCacheCollection } from '../../cache';
import { Entrypoint } from '../Entrypoint';
import type { LoadAndParseFn } from '../Entrypoint.types';
import { rootLog } from '../rootLog';
import type {
  Services,
  Handlers,
  ActionQueueItem,
  SyncScenarioForAction,
  ICollectAction,
  IEvalAction,
  IExplodeReexportsAction,
  IExtractAction,
  IGetExportsAction,
  IProcessEntrypointAction,
  IProcessImportsAction,
  IResolveImportsAction,
  ITransformAction,
  IWorkflowAction,
} from '../types';

export type SyncHandlers<TMode extends 'async' | 'sync'> = Handlers<TMode>;

// eslint-disable-next-line require-yield
function* emptyHandler<
  TAction extends ActionQueueItem,
>(): SyncScenarioForAction<TAction> {
  return undefined as never;
}

export const getHandlers = <TMode extends 'async' | 'sync'>(
  partial: Partial<SyncHandlers<TMode>>
) => ({
  collect: jest.fn(emptyHandler<ICollectAction>),
  evalFile: jest.fn(emptyHandler<IEvalAction>),
  explodeReexports: jest.fn(emptyHandler<IExplodeReexportsAction>),
  extract: jest.fn(emptyHandler<IExtractAction>),
  getExports: jest.fn(emptyHandler<IGetExportsAction>),
  processEntrypoint: jest.fn(emptyHandler<IProcessEntrypointAction>),
  processImports: jest.fn(emptyHandler<IProcessImportsAction>),
  resolveImports: jest.fn(emptyHandler<IResolveImportsAction>),
  transform: jest.fn(emptyHandler<ITransformAction>),
  workflow: jest.fn(emptyHandler<IWorkflowAction>),
  ...partial,
});

export const createServices: () => Services = () => ({
  babel,
  cache: new TransformCacheCollection(),
  loadAndParseFn: jest.fn<ReturnType<LoadAndParseFn>, []>(() => ({
    ast: {} as File,
    code: '',
    evaluator: jest.fn(),
    evalConfig: {},
  })),
  log: rootLog,
  eventEmitter: EventEmitter.dummy,
  options: {} as Services['options'],
});

export const createEntrypoint = (
  services: Services,
  name: string,
  only: string[],
  code?: string
) => {
  const entrypoint = Entrypoint.createRoot(services, name, only, code);

  if (entrypoint.ignored) {
    throw new Error('entrypoint was ignored');
  }

  return entrypoint;
};
