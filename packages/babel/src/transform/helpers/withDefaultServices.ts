import * as babelCore from '@babel/core';

import { EventEmitter } from '@linaria/utils';

import { TransformCacheCollection } from '../../cache';
import { loadAndParse } from '../Entrypoint.helpers';
import { rootLog } from '../rootLog';
import type { Services } from '../types';

type RequiredServices = 'options';
export type PartialServices = Partial<Omit<Services, RequiredServices>> &
  Pick<Services, RequiredServices>;

export const withDefaultServices = ({
  babel = babelCore,
  cache = new TransformCacheCollection(),
  loadAndParseFn = loadAndParse,
  log = rootLog,
  options,
  eventEmitter = EventEmitter.dummy,
}: PartialServices): Services => ({
  babel,
  cache,
  loadAndParseFn,
  log,
  options,
  eventEmitter,
});
