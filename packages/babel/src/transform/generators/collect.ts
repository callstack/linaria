import type { PluginItem } from '@babel/core';

import { buildOptions } from '@linaria/utils';

import { filename as collectorPlugin } from '../../plugins/collector';
import type { ICollectAction, SyncScenarioForAction } from '../types';

/**
 * Parses the specified file, finds tags, applies run-time replacements,
 * removes dead code.
 */
// eslint-disable-next-line require-yield
export function* collect(
  this: ICollectAction<'sync'>
): SyncScenarioForAction<ICollectAction<'sync'>> {
  const { babel, options } = this.services;
  const { valueCache } = this.data;
  const { entrypoint } = this;
  const { ast, code, name, pluginOptions } = entrypoint;

  const transformPlugins: PluginItem[] = [
    [
      collectorPlugin,
      {
        ...pluginOptions,
        values: valueCache,
      },
    ],
  ];

  const transformConfig = buildOptions({
    envName: 'linaria',
    plugins: transformPlugins,
    sourceMaps: true,
    sourceFileName: name,
    inputSourceMap: options.inputSourceMap,
    root: options.root,
    ast: true,
    babelrc: false,
    configFile: false,
    sourceType: 'unambiguous',
  });

  const result = babel.transformFromAstSync(ast, code, {
    ...transformConfig,
    cwd: options.root,
    filename: name,
  });

  if (!result || !result.ast?.program) {
    throw new Error('Babel transform failed');
  }

  return result;
}
