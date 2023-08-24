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

import { TransformCacheCollection } from './cache';
import loadLinariaOptions from './transform-stages/helpers/loadLinariaOptions';
import { Entrypoint } from './transform-stages/queue/Entrypoint';
import { loadAndParse } from './transform-stages/queue/Entrypoint.helpers';
import {
  asyncActionRunner,
  syncActionRunner,
} from './transform-stages/queue/actions/actionRunner';
import { baseHandlers } from './transform-stages/queue/generators';
import {
  asyncResolveImports,
  syncResolveImports,
} from './transform-stages/queue/generators/resolveImports';
import { rootLog } from './transform-stages/queue/rootLog';
import type {
  Handlers,
  IResolveImportsAction,
  Services,
} from './transform-stages/queue/types';
import type { Result } from './types';

type RequiredServices = 'options';
type PartialServices = Partial<Omit<Services, RequiredServices>> &
  Pick<Services, RequiredServices>;

type AllHandlers<TMode extends 'async' | 'sync'> = Handlers<TMode>;

const withDefaultServices = ({
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

export function transformSync(
  partialServices: PartialServices,
  originalCode: string,
  syncResolve: (what: string, importer: string, stack: string[]) => string,
  customHandlers: Partial<AllHandlers<'sync'>> = {}
): Result {
  const services = withDefaultServices(partialServices);
  const { options } = services;
  const pluginOptions = loadLinariaOptions(options.pluginOptions);

  const entrypoint = Entrypoint.createSyncRoot(
    services,
    {
      ...baseHandlers,
      ...customHandlers,
      resolveImports(this: IResolveImportsAction<'sync'>) {
        return syncResolveImports.call(this, syncResolve);
      },
    },
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

  const workflowAction = entrypoint.createAction('workflow', undefined);

  const result = syncActionRunner(workflowAction);

  entrypoint.log('%s is ready', entrypoint.name);

  return result;
}

export default async function transform(
  partialServices: PartialServices,
  originalCode: string,
  asyncResolve: (
    what: string,
    importer: string,
    stack: string[]
  ) => Promise<string | null>,
  customHandlers: Partial<AllHandlers<'sync'>> = {}
): Promise<Result> {
  const services = withDefaultServices(partialServices);
  const { options } = services;
  const pluginOptions = loadLinariaOptions(options.pluginOptions);

  /*
   * This method can be run simultaneously for multiple files.
   * A shared cache is accessible for all runs, but each run has its own queue
   * to maintain the correct processing order. The cache stores the outcome
   * of tree-shaking, and if the result is already stored in the cache
   * but the "only" option has changed, the file will be re-processed using
   * the combined "only" option.
   */
  const entrypoint = Entrypoint.createAsyncRoot(
    services,
    {
      ...baseHandlers,
      ...customHandlers,
      resolveImports(this: IResolveImportsAction<'async'>) {
        return asyncResolveImports.call(this, asyncResolve);
      },
    },
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

  const workflowAction = entrypoint.createAction('workflow', undefined);

  const result = await asyncActionRunner(workflowAction);

  entrypoint.log('%s is ready', entrypoint.name);

  return result;
}
