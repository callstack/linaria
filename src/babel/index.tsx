import loadOptions, { PluginOptions } from './utils/loadOptions';

export default function linaria(_context: any, options: PluginOptions) {
  return {
    plugins: [[require('./extract'), loadOptions(options)]],
  };
}
