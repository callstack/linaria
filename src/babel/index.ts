import { ConfigAPI, TransformCaller } from '@babel/core';

import loadOptions, { PluginOptions } from './utils/loadOptions';
import { debug } from './utils/logger';

function isEnabled(caller?: TransformCaller & { evaluate?: true }) {
  return caller?.name !== 'linaria' || !caller.evaluate;
}

export default function linaria(babel: ConfigAPI, options: PluginOptions) {
  if (!babel.caller(isEnabled)) {
    return {};
  }

  debug('', JSON.stringify(options));
  return {
    plugins: [[require('./extract'), loadOptions(options)]],
  };
}
