import cosmiconfig from 'cosmiconfig';
import type { StrictOptions } from '../types';

export type PluginOptions = StrictOptions & {
  configFile?: string;
};

const explorer = cosmiconfig('linaria');

export default function loadOptions(
  overrides: Partial<PluginOptions> = {}
): Partial<StrictOptions> {
  const { configFile, ignore, ...rest } = overrides;

  const result =
    configFile !== undefined
      ? explorer.loadSync(configFile)
      : explorer.searchSync();

  return {
    displayName: false,
    evaluate: true,
    rules: [
      {
        action: require('../evaluators/shaker').default,
      },
      {
        // The old `ignore` option is used as a default value for `ignore` rule.
        test: ignore ?? /\/node_modules\//,
        action: 'ignore',
      },
    ],
    ...(result ? result.config : null),
    ...rest,
  };
}
