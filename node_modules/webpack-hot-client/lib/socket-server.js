const stringify = require('json-stringify-safe');
const strip = require('strip-ansi');
const WebSocket = require('ws');

function getServer(options) {
  const { host, log, port, server } = options;
  const wssOptions = server ? { server } : { host: host.server, port: port.server };

  if (server && !server.listening) {
    server.listen(port.server, host.server);
  }

  const wss = new WebSocket.Server(wssOptions);

  onConnection(wss, options);
  onError(wss, options);
  onListening(wss, options);

  const broadcast = (data) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };

  const ogClose = wss.close;
  const close = (callback) => {
    try {
      ogClose.call(wss, callback);
    } catch (err) {
      /* istanbul ignore next */
      log.error(err);
    }
  };

  const send = sendData.bind(null, wss, options);

  return Object.assign(wss, { broadcast, close, send });
}

function onConnection(server, options) {
  const { log } = options;

  server.on('connection', (socket) => {
    log.info('WebSocket Client Connected');

    socket.on('error', (err) => {
      /* istanbul ignore next */
      if (err.errno !== 'ECONNRESET') {
        log.warn('client socket error', JSON.stringify(err));
      }
    });

    socket.on('message', (data) => {
      const message = JSON.parse(data);

      if (message.type === 'broadcast') {
        for (const client of server.clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(stringify(message.data));
          }
        }
      }
    });

    // only send stats to newly connected clients, if no previous clients have
    // connected and stats has been modified by webpack
    if (options.stats && options.stats.toJson && server.clients.size === 1) {
      const jsonStats = options.stats.toJson(options.stats);

      /* istanbul ignore if */
      if (!jsonStats) {
        options.log.error('Client Connection: `stats` is undefined');
      }

      server.send(jsonStats);
    }
  });
}

function onError(server, options) {
  const { log } = options;

  server.on('error', (err) => {
    /* istanbul ignore next */
    log.error('WebSocket Server Error', err);
  });
}

function onListening(server, options) {
  /* eslint-disable no-underscore-dangle, no-param-reassign */
  const { host, log } = options;

  if (options.server && options.server.listening) {
    const addr = options.server.address();
    server.host = addr.address;
    server.port = addr.port;
    log.info(`WebSocket Server Attached to ${addr.address}:${addr.port}`);
  } else {
    server.on('listening', () => {
      const { address, port } = server._server.address();
      server.host = address;
      server.port = port;
      // a port.client value of 0 will be falsy, so it should pull the server port
      options.webSocket.port = options.port.client || port;

      log.info(`WebSocket Server Listening on ${host.server}:${port}`);
    });
  }
}

function payload(type, data) {
  return stringify({ type, data });
}

function sendData(server, options, stats) {
  const send = (type, data) => {
    server.broadcast(payload(type, data));
  };

  if (stats.errors && stats.errors.length > 0) {
    if (options.send.errors) {
      const errors = [].concat(stats.errors).map((error) => strip(error));
      send('errors', { errors });
    }
    return;
  }

  if (stats.assets && stats.assets.every((asset) => !asset.emitted)) {
    send('no-change');
    return;
  }

  const { hash, warnings } = stats;

  send('hash', { hash });

  if (warnings.length > 0) {
    if (options.send.warnings) {
      send('warnings', { warnings });
    }
  } else {
    send('ok', { hash });
  }
}

module.exports = {
  getServer,
  payload
};
