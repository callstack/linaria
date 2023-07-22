import { cosmiconfigSync } from 'cosmiconfig';

import type { StrictOptions } from '@linaria/utils';

import type { Stage } from '../../types';

export type PluginOptions = StrictOptions & {
  configFile?: string | false;
  stage?: Stage;
};

const searchPlaces = [
  `.linariarc`,
  `.linariarc.json`,
  `.linariarc.yaml`,
  `.linariarc.yml`,
  `.linariarc.js`,
  `.linariarc.cjs`,
  `.config/linariarc`,
  `.config/linariarc.json`,
  `.config/linariarc.yaml`,
  `.config/linariarc.yml`,
  `.config/linariarc.js`,
  `.config/linariarc.cjs`,
  `linaria.config.js`,
  `linaria.config.cjs`,
];

const explorerSync = cosmiconfigSync('linaria', { searchPlaces });

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
    // eslint-disable-next-line no-nested-ternary
    configFile === false
      ? undefined
      : configFile !== undefined
      ? explorerSync.load(configFile)
      : explorerSync.search();

  const defaultFeatures = {
    dangerousCodeRemover: true,
  };

  const options: StrictOptions = {
    displayName: false,
    evaluate: true,
    extensions: ['.cjs', '.cts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx'],
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
    highPriorityPlugins: ['module-resolver'],
    ...(result ? result.config : {}),
    ...rest,
    features: {
      ...defaultFeatures,
      ...(result ? result.config.features : {}),
      ...rest.features,
    },
  };

  cache.set(overrides, options);

  return options;
}
