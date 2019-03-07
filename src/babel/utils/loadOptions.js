/* @flow */

import cosmiconfig from 'cosmiconfig';
import type { StrictOptions } from '../types';

export type PluginOptions = $Shape<{
  ...StrictOptions,
  configFile: string,
}>;

const explorer = cosmiconfig('linaria');

export default function loadOptions(
  overrides?: PluginOptions = {}
): StrictOptions {
  const { configFile, ...rest } = overrides;

  const result =
    configFile !== undefined
      ? explorer.loadSync(configFile)
      : explorer.searchSync();

  const options = {
    displayName: false,
    evaluate: true,
    ignore: /node_modules/,
    ...(result ? result.config : null),
    ...rest,
  };

  return options;
}
