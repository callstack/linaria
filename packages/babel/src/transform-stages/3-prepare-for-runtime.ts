import type {
  BabelFileResult,
  PluginItem,
  TransformOptions,
} from '@babel/core';
import type { File } from '@babel/types';

import type { StrictOptions } from '@linaria/utils';
import { buildOptions } from '@linaria/utils';

import type { Core } from '../babel';
import type { Options, ValueCache } from '../types';

/**
 * Parses the specified file, finds tags, applies run-time replacements,
 * removes dead code.
 */
export default function prepareForRuntime(
  babel: Core,
  ast: File,
  code: string,
  valueCache: ValueCache,
  pluginOptions: StrictOptions,
  options: Pick<Options, 'filename' | 'inputSourceMap' | 'root'>,
  babelConfig: TransformOptions
): BabelFileResult {
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

  const result = babel.transformFromAstSync(ast, code, {
    ...transformConfig,
    cwd: babelConfig.cwd,
    filename: babelConfig.filename ?? options.filename,
  });

  if (!result || !result.ast?.program) {
    throw new Error('Babel transform failed');
  }

  return result;
}
