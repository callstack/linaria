import loadOptions, { PluginOptions } from './utils/loadOptions';

export default function linaria(context: any, options: PluginOptions) {
  return options.disabled
    ? {}
    : {
        plugins: [[require('./extract'), loadOptions(options)]],
      };
}
