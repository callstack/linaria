const { Server: HttpsServer } = require('https');

const validate = require('@webpack-contrib/schema-utils');
const merge = require('merge-options').bind({ concatArrays: true });
const weblog = require('webpack-log');

const schema = require('../schemas/options.json');

const HotClientError = require('./HotClientError');

const defaults = {
  allEntries: false,
  autoConfigure: true,
  host: 'localhost',
  hmr: true,
  // eslint-disable-next-line no-undefined
  https: undefined,
  logLevel: 'info',
  logTime: false,
  port: 0,
  reload: true,
  send: {
    errors: true,
    warnings: true
  },
  server: null,
  stats: {
    context: process.cwd()
  },
  validTargets: ['web'],
  test: false
};

module.exports = (opts = {}) => {
  validate({ name: 'webpack-hot-client', schema, target: opts });

  const options = merge({}, defaults, opts);
  const log = weblog({
    name: 'hot',
    id: options.test ? null : 'webpack-hot-client',
    level: options.logLevel,
    timestamp: options.logTime
  });

  options.log = log;

  if (typeof options.host === 'string') {
    options.host = {
      client: options.host,
      server: options.host
    };
  } else if (!options.host.server) {
    throw new HotClientError('`host.server` must be defined when setting host to an Object');
  } else if (!options.host.client) {
    throw new HotClientError('`host.client` must be defined when setting host to an Object');
  }

  if (typeof options.port === 'number') {
    options.port = {
      client: options.port,
      server: options.port
    };
  } else if (isNaN(parseInt(options.port.server, 10))) {
    throw new HotClientError('`port.server` must be defined when setting host to an Object');
  } else if (isNaN(parseInt(options.port.client, 10))) {
    throw new HotClientError('`port.client` must be defined when setting host to an Object');
  }

  const { server } = options;

  if (server && server instanceof HttpsServer && typeof options.https === 'undefined') {
    options.https = true;
  }

  if (server && server.listening) {
    options.webSocket = {
      host: server.address().address,
      // a port.client value of 0 will be falsy, so it should pull the server port
      port: options.port.client || server.address().port
    };
  } else {
    options.webSocket = {
      host: options.host.client,
      port: options.port.client
    };
  }

  return options;
};
