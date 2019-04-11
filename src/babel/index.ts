import loadOptions, { PluginOptions } from './utils/loadOptions';

module.exports = function linaria(context: any, options: PluginOptions) {
  return {
    plugins: [[require('./extract'), loadOptions(options)]],
  };
};
