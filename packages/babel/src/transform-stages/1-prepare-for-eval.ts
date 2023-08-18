import type { StrictOptions } from '@linaria/utils';
import { EventEmitter } from '@linaria/utils';

import type { Core } from '../babel';
import type { TransformCacheCollection } from '../cache';
import type { ITransformFileResult, Options } from '../types';

import { AsyncActionQueue, SyncActionQueue } from './queue/ActionQueue';
import { createEntrypoint } from './queue/createEntrypoint';
import { addToCodeCache } from './queue/generators/addToCodeCache';
import { explodeReexports } from './queue/generators/explodeReexports';
import { getExports } from './queue/generators/getExports';
import { processEntrypoint } from './queue/generators/processEntrypoint';
import { processImports } from './queue/generators/processImports';
import {
  asyncResolveImports,
  syncResolveImports,
} from './queue/generators/resolveImports';
import { transform } from './queue/generators/transform';
import { rootLog } from './queue/rootLog';
import type { IEntrypoint } from './queue/types';

export function prepareForEvalSync(
  babel: Core,
  cache: TransformCacheCollection,
  resolve: (what: string, importer: string, stack: string[]) => string,
  partialEntrypoint: Pick<IEntrypoint, 'code' | 'name' | 'only'>,
  pluginOptions: StrictOptions,
  options: Pick<Options, 'root' | 'inputSourceMap'>,
  eventEmitter = EventEmitter.dummy
): ITransformFileResult | undefined {
  const services = { babel, cache, options, eventEmitter };

  const entrypoint = createEntrypoint(
    services,
    { log: rootLog },
    partialEntrypoint.name,
    partialEntrypoint.only,
    partialEntrypoint.code,
    pluginOptions
  );

  if (entrypoint === 'ignored') {
    return undefined;
  }

  const queue = new SyncActionQueue(
    services,
    {
      addToCodeCache,
      explodeReexports,
      getExports,
      processEntrypoint,
      processImports,
      resolveImports: syncResolveImports.bind(null, resolve),
      transform,
    },
    entrypoint
  );

  while (!queue.isEmpty()) {
    queue.runNext();
  }

  return cache.get('code', entrypoint.name)?.result;
}

/**
 * Parses the specified file and recursively all its dependencies,
 * finds tags, applies eval-time replacements, removes dead code.
 */
export default async function prepareForEval(
  babel: Core,
  cache: TransformCacheCollection,
  resolve: (
    what: string,
    importer: string,
    stack: string[]
  ) => Promise<string | null>,
  partialEntrypoint: Pick<IEntrypoint, 'code' | 'name' | 'only'>,
  pluginOptions: StrictOptions,
  options: Pick<Options, 'root' | 'inputSourceMap'>,
  eventEmitter = EventEmitter.dummy
): Promise<ITransformFileResult | undefined> {
  const services = { babel, cache, options, eventEmitter };

  /*
   * This method can be run simultaneously for multiple files.
   * A shared cache is accessible for all runs, but each run has its own queue
   * to maintain the correct processing order. The cache stores the outcome
   * of tree-shaking, and if the result is already stored in the cache
   * but the "only" option has changed, the file will be re-processed using
   * the combined "only" option.
   */
  const entrypoint = createEntrypoint(
    services,
    { log: rootLog },
    partialEntrypoint.name,
    partialEntrypoint.only,
    partialEntrypoint.code,
    pluginOptions
  );

  if (entrypoint === 'ignored') {
    return undefined;
  }

  const queue = new AsyncActionQueue(
    services,
    {
      addToCodeCache,
      explodeReexports,
      getExports,
      processEntrypoint,
      processImports,
      resolveImports: asyncResolveImports.bind(null, resolve),
      transform,
    },
    entrypoint
  );

  while (!queue.isEmpty()) {
    // eslint-disable-next-line no-await-in-loop
    await queue.runNext();
  }

  entrypoint.log('queue is empty, %s is ready', entrypoint.name);

  return cache.get('code', entrypoint.name)?.result;
}
