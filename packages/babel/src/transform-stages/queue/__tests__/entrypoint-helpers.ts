import * as babel from '@babel/core';
import type { File } from '@babel/types';

import type { StrictOptions } from '@linaria/utils';
import { EventEmitter } from '@linaria/utils';

import { TransformCacheCollection } from '../../../cache';
import { Entrypoint } from '../Entrypoint';
import type { LoadAndParseFn } from '../Entrypoint.types';
import { rootLog } from '../rootLog';
import type { Services, Handlers } from '../types';

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
