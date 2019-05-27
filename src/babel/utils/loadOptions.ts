import cosmiconfig from 'cosmiconfig';
import { StrictOptions } from '../types';

export type PluginOptions = StrictOptions & {
  configFile?: string;
};

const explorer = cosmiconfig('linaria');

export default function loadOptions(
  overrides: Partial<PluginOptions> = {}
): Partial<StrictOptions> {
  const { configFile, ...rest } = overrides;

  const result =
    configFile !== undefined
      ? explorer.loadSync(configFile)
      : explorer.searchSync();

  return {
    displayName: false,
    evaluate: true,
    ignore: /node_modules/,
    ...(result ? result.config : null),
    ...rest,
  };
}
