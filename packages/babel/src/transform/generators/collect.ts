import type { PluginItem } from '@babel/core';

import { buildOptions } from '@linaria/utils';

import { filename as collectorPlugin } from '../../plugins/collector';
import { getLinariaMetadata } from '../../utils/withLinariaMetadata';
import type { ICollectAction, SyncScenarioForAction } from '../types';

/**
 * Parses the specified file, finds tags, applies run-time replacements,
 * removes dead code.
 */
// eslint-disable-next-line require-yield
export function* collect(
  this: ICollectAction
): SyncScenarioForAction<ICollectAction> {
  const { babel, options } = this.services;
  const { valueCache } = this.data;
  const { entrypoint } = this;
  const { loadedAndParsed, name } = entrypoint;

  if (loadedAndParsed.evaluator === 'ignored') {
    throw new Error('entrypoint was ignored');
  }

  const transformPlugins: PluginItem[] = [
    [
      collectorPlugin,
      {
        ...options.pluginOptions,
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

  const result = babel.transformFromAstSync(
    loadedAndParsed.ast,
    loadedAndParsed.code,
    {
      ...transformConfig,
      cwd: options.root,
      filename: name,
    }
  );

  if (!result || !result.ast?.program) {
    throw new Error('Babel transform failed');
  }

  const linariaMetadata = getLinariaMetadata(result.metadata);

  return {
    ast: result.ast,
    code: result.code,
    map: result.map,
    metadata: linariaMetadata ?? null,
  };
}
