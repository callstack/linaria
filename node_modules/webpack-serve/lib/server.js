const http = require('http');
const https = require('https');

const chalk = require('chalk');
const killable = require('killable');
const urljoin = require('url-join');
const weblog = require('webpack-log');

module.exports = {
  bind(server, options) {
    const { bus } = options;
    const log = weblog({ id: 'webpack-serve', name: 'serve' });

    server.once('listening', () => {
      const { port } = server.address();
      const uri = `${options.protocol}://${options.host}:${port}`;

      log.info(chalk`Project is running at {blue ${uri}}`);

      if (options.clipboard && !options.open) {
        try {
          // eslint-disable-next-line global-require
          const clip = require('clipboardy');
          clip.writeSync(uri);
          log.info(chalk.grey('Server URI copied to clipboard'));
        } catch (error) {
          log.warn(
            chalk.grey(
              'Failed to copy server URI to clipboard. ' +
                "Use logLevel: 'debug' for more information."
            )
          );
          log.debug(error);
        }
      }

      bus.emit('listening', { server, options });

      if (options.open) {
        const open = require('opn'); // eslint-disable-line global-require
        const { app, path = '' } = options.open;
        const openOpts = app ? { app } : {};
        open(urljoin(uri, path), openOpts);
      }
    });
  },

  getServer(app, options) {
    // eslint-disable-next-line global-require, import/no-unresolved
    const http2 = options.http2 ? require('http2') : null;
    const args = [];
    let method = (http2 || http).createServer;

    if (app) {
      args.unshift(app.callback());
    }

    if (options.https) {
      args.unshift(options.https);
      method = http2 ? http2.createSecureServer : https.createServer;
    }

    const server = method(...args);

    killable(server);

    return server;
  },
};
