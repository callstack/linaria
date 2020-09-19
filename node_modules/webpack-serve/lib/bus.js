const isPlainObject = require('is-plain-obj');
const nanobus = require('nanobus');
const weblog = require('webpack-log');

const WebpackServeError = require('./WebpackServeError');

module.exports = (options) => {
  const log = weblog({ id: 'webpack-serve', name: 'serve' });
  const bus = nanobus();

  if (isPlainObject(options.on)) {
    for (const event of Object.keys(options.on)) {
      const fn = options.on[event];

      if (typeof fn === 'function') {
        log.info(`Subscribed to '${event}' event`);
        bus.on(event, fn);
      } else {
        throw new WebpackServeError(
          `The value for an \`on\` event handler must be a Function. event: ${event}`
        );
      }
    }
  } else if (options.on) {
    throw new WebpackServeError(
      'The value for the `on` option must be an Object. Please see the README.'
    );
  }

  return bus;
};
