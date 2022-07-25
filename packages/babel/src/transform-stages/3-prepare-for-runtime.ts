import * as babel from '@babel/core';

import { buildOptions, loadBabelOptions } from '@linaria/utils';

import type { Options, ValueCache } from '../types';

import cachedParseSync from './helpers/cachedParseSync';
import loadLinariaOptions from './helpers/loadLinariaOptions';

/**
 * Parses the specified file, finds tags, applies run-time replacements,
 * removes dead code.
 */
export default function prepareForRuntime(
  code: string,
  valueCache: ValueCache,
  options: Options,
  babelConfig: babel.TransformOptions
) {
  const pluginOptions = loadLinariaOptions(options.pluginOptions);
  const babelOptions = loadBabelOptions(
    options.filename,
    pluginOptions?.babelOptions
  );

  const file = cachedParseSync(code, babelOptions);

  const transformPlugins: babel.PluginItem[] = [
    [
      require.resolve('../plugins/collector'),
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
    sourceFileName: babelConfig.filename ?? options.filename,
    inputSourceMap: options.inputSourceMap,
    root: options.root,
    ast: true,
    babelrc: false,
    configFile: false,
  });

  const result = babel.transformFromAstSync(file, code, {
    ...transformConfig,
    cwd: babelConfig.cwd,
    filename: babelConfig.filename ?? options.filename,
  });

  if (!result || !result.ast?.program) {
    throw new Error('Babel transform failed');
  }

  return result;
}
