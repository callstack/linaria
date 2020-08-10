/**
 * File defines babel prest for Linaria.
 * It uses ./extract function that is an entry point for styles extraction.
 * It also bypass babel options defined in Linaria config file with it's defaults (see ./utils/loadOptions).
 */
import type { ConfigAPI, TransformCaller } from '@babel/core';

import type { PluginOptions } from './utils/loadOptions';
import loadOptions from './utils/loadOptions';
import { debug } from './utils/logger';

function isEnabled(caller?: TransformCaller & { evaluate?: true }) {
  return caller?.name !== 'linaria' || !caller.evaluate;
}

export default function linaria(babel: ConfigAPI, options: PluginOptions) {
  if (!babel.caller(isEnabled)) {
    return {};
  }
  debug('options', JSON.stringify(options));
  return {
    plugins: [[require('./extract'), loadOptions(options)]],
  };
}
