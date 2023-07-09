import { cosmiconfigSync } from 'cosmiconfig';

import type { StrictOptions } from '@linaria/utils';

import type { Stage } from '../../types';

export type PluginOptions = StrictOptions & {
  configFile?: string;
  stage?: Stage;
};

const explorerSync = cosmiconfigSync('linaria');

const cache = new WeakMap<Partial<PluginOptions>, StrictOptions>();
const defaultOverrides = {};
const nodeModulesRegExp = /[\\/]node_modules[\\/]/;

export default function loadLinariaOptions(
  overrides: Partial<PluginOptions> = defaultOverrides
): StrictOptions {
  if (cache.has(overrides)) {
    return cache.get(overrides)!;
  }

  const { configFile, ignore, rules, babelOptions = {}, ...rest } = overrides;

  const result =
    configFile !== undefined
      ? explorerSync.load(configFile)
      : explorerSync.search();

  const options = {
    displayName: false,
    evaluate: true,
    extensions: [
      '.cjs',
      '.cts',
      '.json',
      '.js',
      '.jsx',
      '.mjs',
      '.mts',
      '.ts',
      '.tsx',
    ],
    rules: rules ?? [
      {
        action: require.resolve('@linaria/shaker'),
      },
      {
        // The old `ignore` option is used as a default value for `ignore` rule.
        test: ignore ?? nodeModulesRegExp,
        action: 'ignore',
      },
      {
        // Do not ignore ES-modules
        test: (filename, code) => {
          if (!nodeModulesRegExp.test(filename)) {
            return false;
          }

          // If a file contains `export` or `import` keywords, we assume it's an ES-module
          return /\b(?:export|import)\b/.test(code);
        },
        action: require.resolve('@linaria/shaker'),
      },
    ],
    babelOptions,
    ...(result ? result.config : null),
    ...rest,
  };

  cache.set(overrides, options);

  return options;
}
