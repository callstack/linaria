import cosmiconfig from 'cosmiconfig';

import type { StrictOptions } from '@linaria/utils';

import type { Stage } from '../../types';

export type PluginOptions = StrictOptions & {
  configFile?: string;
  stage?: Stage;
};

const explorer = cosmiconfig('linaria');

const cache = new WeakMap<Partial<PluginOptions>, StrictOptions>();

export default function loadLinariaOptions(
  overrides: Partial<PluginOptions> = {}
): StrictOptions {
  if (cache.has(overrides)) {
    return cache.get(overrides)!;
  }

  const { configFile, ignore, rules, babelOptions = {}, ...rest } = overrides;

  const result =
    configFile !== undefined
      ? explorer.loadSync(configFile)
      : explorer.searchSync();

  const options = {
    displayName: false,
    evaluate: true,
    extensions: ['.json', '.js', '.jsx', '.ts', '.tsx'],
    rules: rules ?? [
      {
        action: require.resolve('@linaria/shaker'),
      },
      {
        // The old `ignore` option is used as a default value for `ignore` rule.
        test: ignore ?? /[\\/]node_modules[\\/]/,
        action: 'ignore',
      },
    ],
    babelOptions,
    ...(result ? result.config : null),
    ...rest,
  };

  cache.set(overrides, options);

  return options;
}
