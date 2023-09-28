/**
 * This file exposes transform function that:
 * - parse the passed code to AST
 * - transforms the AST using Linaria babel preset ('./babel/index.js) and additional config defined in Linaria config file or passed to bundler configuration.
 * - runs generated CSS files through default of user-defined preprocessor
 * - generates source maps for CSS files
 * - return transformed code (without Linaria template literals), generated CSS, source maps and babel metadata from transform step.
 */

import { isFeatureEnabled } from '@linaria/utils';

import { TransformCacheCollection } from './cache';
import { Entrypoint } from './transform/Entrypoint';
import {
  asyncActionRunner,
  syncActionRunner,
} from './transform/actions/actionRunner';
import { baseHandlers } from './transform/generators';
import {
  asyncResolveImports,
  syncResolveImports,
} from './transform/generators/resolveImports';
import type { PartialOptions } from './transform/helpers/loadLinariaOptions';
import loadLinariaOptions from './transform/helpers/loadLinariaOptions';
import { withDefaultServices } from './transform/helpers/withDefaultServices';
import type {
  Handlers,
  IResolveImportsAction,
  Services,
} from './transform/types';
import type { Result } from './types';

type PartialServices = Partial<Omit<Services, 'options'>> & {
  options: Omit<Services['options'], 'pluginOptions'> & {
    pluginOptions?: PartialOptions;
  };
};

type AllHandlers<TMode extends 'async' | 'sync'> = Handlers<TMode>;

export function transformSync(
  partialServices: PartialServices,
  originalCode: string,
  syncResolve: (what: string, importer: string, stack: string[]) => string,
  customHandlers: Partial<AllHandlers<'sync'>> = {}
): Result {
  const { options } = partialServices;
  const pluginOptions = loadLinariaOptions(options.pluginOptions);
  const services = withDefaultServices({
    ...partialServices,
    options: {
      ...options,
      pluginOptions,
    },
  });

  if (
    !isFeatureEnabled(pluginOptions.features, 'globalCache', options.filename)
  ) {
    // If global cache is disabled, we need to create a new cache for each file
    services.cache = new TransformCacheCollection();
  }

  const entrypoint = Entrypoint.createRoot(
    services,
    options.filename,
    ['__linariaPreval'],
    originalCode
  );

  if (entrypoint.ignored) {
    return {
      code: originalCode,
      sourceMap: options.inputSourceMap,
    };
  }

  const workflowAction = entrypoint.createAction('workflow', undefined);

  try {
    const result = syncActionRunner(workflowAction, {
      ...baseHandlers,
      ...customHandlers,
      resolveImports() {
        return syncResolveImports.call(this, syncResolve);
      },
    });

    entrypoint.log('%s is ready', entrypoint.name);

    return result;
  } catch (err) {
    entrypoint.log('Unhandled error %O', err);

    if (
      isFeatureEnabled(pluginOptions.features, 'softErrors', options.filename)
    ) {
      // eslint-disable-next-line no-console
      console.error(`Error during transform of ${entrypoint.name}:`, err);

      return {
        code: originalCode,
        sourceMap: options.inputSourceMap,
      };
    }

    throw err;
  }
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
  const { options } = partialServices;
  const pluginOptions = loadLinariaOptions(options.pluginOptions);
  const services = withDefaultServices({
    ...partialServices,
    options: {
      ...options,
      pluginOptions,
    },
  });

  if (
    !isFeatureEnabled(pluginOptions.features, 'globalCache', options.filename)
  ) {
    // If global cache is disabled, we need to create a new cache for each file
    services.cache = new TransformCacheCollection();
  }

  /*
   * This method can be run simultaneously for multiple files.
   * A shared cache is accessible for all runs, but each run has its own queue
   * to maintain the correct processing order. The cache stores the outcome
   * of tree-shaking, and if the result is already stored in the cache
   * but the "only" option has changed, the file will be re-processed using
   * the combined "only" option.
   */
  const entrypoint = Entrypoint.createRoot(
    services,
    options.filename,
    ['__linariaPreval'],
    originalCode
  );

  if (entrypoint.ignored) {
    return {
      code: originalCode,
      sourceMap: options.inputSourceMap,
    };
  }

  const workflowAction = entrypoint.createAction('workflow', undefined);

  try {
    const result = await asyncActionRunner(workflowAction, {
      ...baseHandlers,
      ...customHandlers,
      resolveImports(this: IResolveImportsAction) {
        return asyncResolveImports.call(this, asyncResolve);
      },
    });

    entrypoint.log('%s is ready', entrypoint.name);

    return result;
  } catch (err) {
    entrypoint.log('Unhandled error %O', err);

    if (
      isFeatureEnabled(pluginOptions.features, 'softErrors', options.filename)
    ) {
      // eslint-disable-next-line no-console
      console.error(`Error during transform of ${entrypoint.name}:`, err);

      return {
        code: originalCode,
        sourceMap: options.inputSourceMap,
      };
    }

    throw err;
  }
}
