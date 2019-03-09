import cosmiconfig from 'cosmiconfig';
import { StrictOptions } from '../types';

export type PluginOptions = Partial<{
  configFile: string
} & StrictOptions>;

const explorer = cosmiconfig('linaria');

export default function loadOptions(overrides: PluginOptions = {}): StrictOptions {
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
  } as StrictOptions;

  return options;
}
