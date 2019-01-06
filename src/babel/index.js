const cosmiconfig = require('cosmiconfig');

const explorer = cosmiconfig('linaria');

module.exports = function linaria(context, options) {
  // Load configuration file
  const result = explorer.searchSync();

  // Set some defaults for options
  // eslint-disable-next-line no-param-reassign
  options = {
    displayName: false,
    evaluate: true,
    ignore: /node_modules/,
    ...(result ? result.config : null),
    ...options,
  };

  return {
    plugins: [[require('./extract'), options]],
  };
};
