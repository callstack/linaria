/**
 * This file exposes transform function that:
 * - parse the passed code to AST
 * - transforms the AST using Linaria babel preset ('./babel/index.js) and additional config defined in Linaria config file or passed to bundler configuration.
 * - runs generated CSS files through default of user-defined preprocessor
 * - generates source maps for CSS files
 * - return transformed code (without Linaria template literals), generated CSS, source maps and babel metadata from transform step.
 */

import type { TransformOptions } from '@babel/core';
import * as babel from '@babel/core';

import { EventEmitter } from '@linaria/utils';

import { TransformCacheCollection } from './cache';
import loadLinariaOptions from './transform-stages/helpers/loadLinariaOptions';
import {
  AsyncActionQueue,
  SyncActionQueue,
} from './transform-stages/queue/ActionQueue';
import { keyOf } from './transform-stages/queue/actions/action';
import { getTaskResult } from './transform-stages/queue/actions/actionRunner';
import { createEntrypoint } from './transform-stages/queue/createEntrypoint';
import { baseHandlers } from './transform-stages/queue/generators';
import {
  asyncResolveImports,
  syncResolveImports,
} from './transform-stages/queue/generators/resolveImports';
import { rootLog } from './transform-stages/queue/rootLog';
import type { Options, Result } from './types';

export function transformSync(
  originalCode: string,
  options: Options,
  syncResolve: (what: string, importer: string, stack: string[]) => string,
  babelConfig: TransformOptions = {},
  cache = new TransformCacheCollection(),
  eventEmitter = EventEmitter.dummy
): Result {
  if (Object.keys(babelConfig).length > 0) {
    throw new Error('babelConfig is not supported anymore');
  }

  const services = { babel, cache, options, eventEmitter };
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
  originalCode: string,
  options: Options,
  asyncResolve: (
    what: string,
    importer: string,
    stack: string[]
  ) => Promise<string | null>,
  babelConfig: TransformOptions = {},
  cache = new TransformCacheCollection(),
  eventEmitter = EventEmitter.dummy
): Promise<Result> {
  if (Object.keys(babelConfig).length > 0) {
    throw new Error('babelConfig is not supported anymore');
  }

  const services = { babel, cache, options, eventEmitter };
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
