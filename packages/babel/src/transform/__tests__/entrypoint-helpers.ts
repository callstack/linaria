import * as babel from '@babel/core';
import type { File } from '@babel/types';

import type { StrictOptions } from '@linaria/utils';
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
} from '../types';

export type SyncHandlers<TMode extends 'async' | 'sync'> = Handlers<TMode>;

// eslint-disable-next-line require-yield
function* emptyHandler<
  TAction extends ActionQueueItem<'sync'>,
>(): SyncScenarioForAction<TAction> {
  return undefined as never;
}

export const getHandlers = <TMode extends 'async' | 'sync'>(
  partial: Partial<SyncHandlers<TMode>>
) => ({
  addToCodeCache: jest.fn(emptyHandler),
  collect: jest.fn(emptyHandler),
  evalFile: jest.fn(emptyHandler),
  explodeReexports: jest.fn(emptyHandler),
  extract: jest.fn(emptyHandler),
  getExports: jest.fn(emptyHandler),
  processEntrypoint: jest.fn(emptyHandler),
  processImports: jest.fn(emptyHandler),
  resolveImports: jest.fn(emptyHandler),
  transform: jest.fn(emptyHandler),
  workflow: jest.fn(emptyHandler),
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

export const createSyncEntrypoint = (
  services: Services,
  actionHandlers: Handlers<'sync'>,
  name: string,
  only: string[],
  code?: string
) => {
  const entrypoint = Entrypoint.createSyncRoot(
    services,
    actionHandlers,
    name,
    only,
    code,
    services.options.pluginOptions as StrictOptions
  );

  if (entrypoint === 'ignored') {
    throw new Error('entrypoint was ignored');
  }

  return entrypoint;
};
export const createAsyncEntrypoint = (
  services: Services,
  actionHandlers: Handlers<'async' | 'sync'>,
  name: string,
  only: string[],
  code?: string
) => {
  const entrypoint = Entrypoint.createAsyncRoot(
    services,
    actionHandlers,
    name,
    only,
    code,
    services.options.pluginOptions as StrictOptions
  );

  if (entrypoint === 'ignored') {
    throw new Error('entrypoint was ignored');
  }

  return entrypoint;
};
