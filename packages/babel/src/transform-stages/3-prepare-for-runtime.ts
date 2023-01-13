import type {
  BabelFileResult,
  PluginItem,
  TransformOptions,
} from '@babel/core';

import { buildOptions, loadBabelOptions } from '@linaria/utils';

import type { Core } from '../babel';
import type { Options, ValueCache } from '../types';

import cachedParseSync from './helpers/cachedParseSync';
import loadLinariaOptions from './helpers/loadLinariaOptions';

/**
 * Parses the specified file, finds tags, applies run-time replacements,
 * removes dead code.
 */
export default function prepareForRuntime(
  babel: Core,
  code: string,
  valueCache: ValueCache,
  options: Options,
  babelConfig: TransformOptions
): BabelFileResult {
  const pluginOptions = loadLinariaOptions(options.pluginOptions);
  const babelOptions = loadBabelOptions(
    babel,
    options.filename,
    pluginOptions?.babelOptions
  );

  const file = cachedParseSync(babel, code, babelOptions);

  const transformPlugins: PluginItem[] = [
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
    sourceType: 'unambiguous',
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
