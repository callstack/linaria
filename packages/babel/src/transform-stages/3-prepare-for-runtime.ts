import * as babel from '@babel/core';

import { loadBabelOptions } from '@linaria/utils';

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

  const result = babel.transformFromAstSync(file, code, {
    ...(babelOptions?.rootMode ? { rootMode: babelOptions.rootMode } : null),
    cwd: babelConfig.cwd,
    filename: babelConfig.filename ?? options.filename,
    presets: [
      ...(babelOptions?.presets ?? []),
      ...(babelConfig?.presets ?? []),
    ],
    plugins: [
      [
        require.resolve('../plugins/collector'),
        {
          ...pluginOptions,
          values: valueCache,
        },
      ],
      ...(babelOptions?.plugins ?? []),
      ...(babelConfig?.plugins ?? []),
    ],
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    sourceFileName: options.filename,
    inputSourceMap: options.inputSourceMap,
    root: options.root,
    ast: true,
  });

  if (!result || !result.ast?.program) {
    throw new Error('Babel transform failed');
  }

  return result;
}
