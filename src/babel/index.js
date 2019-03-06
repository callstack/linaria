const cosmiconfig = require('cosmiconfig');

const explorer = cosmiconfig('linaria');

module.exports = function linaria(context, options) {
  const { configFile, ...rest } = options;
  // Load configuration file
  const result =
    configFile !== undefined
      ? explorer.loadSync(configFile)
      : explorer.searchSync();

  // Set some defaults for options
  // eslint-disable-next-line no-param-reassign
  options = {
    displayName: false,
    evaluate: true,
    ignore: /node_modules/,
    ...(result ? result.config : null),
    ...rest,
  };

  return {
    plugins: [[require('./extract'), options]],
  };
};
