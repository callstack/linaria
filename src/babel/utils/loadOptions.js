/* @flow */

import cosmiconfig from 'cosmiconfig';
import readPkg from 'read-pkg';
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

  let pkgVersionString = '';
  try {
    const pkgJson = readPkg.sync();
    pkgVersionString = `${pkgJson.name}@${pkgJson.version}`;
  } catch (err) {
    // ignore
  }

  const options = {
    displayName: false,
    evaluate: true,
    ignore: /node_modules/,
    classPrefix: '',
    pkgVersionString,
    ...(result ? result.config : null),
    ...rest,
  };

  return options;
}
