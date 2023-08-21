/**
 * This file exposes transform function that:
 * - parse the passed code to AST
 * - transforms the AST using Linaria babel preset ('./babel/index.js) and additional config defined in Linaria config file or passed to bundler configuration.
 * - runs generated CSS files through default of user-defined preprocessor
 * - generates source maps for CSS files
 * - return transformed code (without Linaria template literals), generated CSS, source maps and babel metadata from transform step.
 */

import * as babelCore from '@babel/core';

import { EventEmitter } from '@linaria/utils';

import type { Core } from './babel';
import { TransformCacheCollection } from './cache';
import loadLinariaOptions from './transform-stages/helpers/loadLinariaOptions';
import {
  AsyncActionQueue,
  SyncActionQueue,
} from './transform-stages/queue/ActionQueue';
import type { Handlers } from './transform-stages/queue/GenericActionQueue';
import { keyOf } from './transform-stages/queue/actions/action';
import { getTaskResult } from './transform-stages/queue/actions/actionRunner';
import { createEntrypoint } from './transform-stages/queue/createEntrypoint';
import { baseHandlers } from './transform-stages/queue/generators';
import {
  asyncResolveImports,
  syncResolveImports,
} from './transform-stages/queue/generators/resolveImports';
import { rootLog } from './transform-stages/queue/rootLog';
import type {
  ActionQueueItem,
  GetGeneratorForRes,
} from './transform-stages/queue/types';
import type { Options, Result } from './types';

interface IServices {
  babel?: Core;
  cache?: TransformCacheCollection;
  options: Options;
  eventEmitter?: EventEmitter;
}

type RequiredServices = Required<IServices>;

type AllHandlers<TRes extends Promise<void> | void> = Handlers<
  GetGeneratorForRes<TRes, ActionQueueItem>,
  RequiredServices
>;

export function transformSync(
  {
    babel = babelCore,
    cache = new TransformCacheCollection(),
    options,
    eventEmitter = EventEmitter.dummy,
  }: IServices,
  originalCode: string,
  syncResolve: (what: string, importer: string, stack: string[]) => string,
  customHandlers: Partial<AllHandlers<void>> = {}
): Result {
  const services: RequiredServices = { babel, cache, options, eventEmitter };
  const pluginOptions = loadLinariaOptions(options.pluginOptions);

  const entrypoint = createEntrypoint(
    services,
    { log: rootLog },
    options.filename,
    ['__linariaPreval'],
    originalCode,
    pluginOptions
  );

  if (entrypoint === 'ignored') {
    return {
      code: originalCode,
      sourceMap: options.inputSourceMap,
    };
  }

  const queue = new SyncActionQueue(
    services,
    {
      ...baseHandlers,
      ...customHandlers,
      resolveImports: syncResolveImports.bind(null, syncResolve),
    },
    entrypoint
  );

  const workflowAction = queue.next('workflow', entrypoint, {});

  while (!queue.isEmpty()) {
    queue.runNext();
  }

  entrypoint.log('queue is empty, %s is ready', entrypoint.name);

  return getTaskResult(entrypoint, keyOf(workflowAction)) as Result;
}

export default async function transform(
  {
    babel = babelCore,
    cache = new TransformCacheCollection(),
    options,
    eventEmitter = EventEmitter.dummy,
  }: IServices,
  originalCode: string,
  asyncResolve: (
    what: string,
    importer: string,
    stack: string[]
  ) => Promise<string | null>,
  customHandlers: Partial<AllHandlers<Promise<void> | void>> = {}
): Promise<Result> {
  const services: RequiredServices = { babel, cache, options, eventEmitter };
  const pluginOptions = loadLinariaOptions(options.pluginOptions);

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
    options.filename,
    ['__linariaPreval'],
    originalCode,
    pluginOptions
  );

  if (entrypoint === 'ignored') {
    return {
      code: originalCode,
      sourceMap: options.inputSourceMap,
    };
  }

  const queue = new AsyncActionQueue(
    services,
    {
      ...baseHandlers,
      ...customHandlers,
      resolveImports: asyncResolveImports.bind(null, asyncResolve),
    },
    entrypoint
  );

  const workflowAction = queue.next('workflow', entrypoint, {});

  while (!queue.isEmpty()) {
    // eslint-disable-next-line no-await-in-loop
    await queue.runNext();
  }

  entrypoint.log('queue is empty, %s is ready', entrypoint.name);

  return getTaskResult(entrypoint, keyOf(workflowAction)) as Result;
}
