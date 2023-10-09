import { cosmiconfigSync } from 'cosmiconfig';

import type { FeatureFlags, StrictOptions } from '@linaria/utils';

import type { PluginOptions } from '../../types';

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

export type PartialOptions = Partial<Omit<PluginOptions, 'features'>> & {
  features?: Partial<FeatureFlags>;
};

const cache = new WeakMap<Partial<PartialOptions>, StrictOptions>();
const defaultOverrides = {};
const nodeModulesRegExp = /[\\/]node_modules[\\/]/;

export default function loadLinariaOptions(
  overrides: PartialOptions = defaultOverrides
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

  const defaultFeatures: FeatureFlags = {
    dangerousCodeRemover: true,
    globalCache: true,
    happyDOM: true,
    softErrors: false,
    useBabelConfigs: true,
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
          return /(?:^|\*\/|;|})\s*(?:export|import)\s/m.test(code);
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
