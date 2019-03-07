/* @flow */

import loadOptions, { type PluginOptions } from './utils/loadOptions';

module.exports = function linaria(context: any, options: PluginOptions) {
  return {
    plugins: [[require('./extract'), loadOptions(options)]],
  };
};
