const { validate } = require('@webpack-contrib/cli-utils');

const flags = require('../schemas/flags');

function parseGroup(obj, prefix) {
  let result;
  for (const key of Object.keys(obj)) {
    if (obj[key] && key.indexOf(prefix) === 0) {
      if (!result) {
        result = {};
      }
      const name = key.replace(prefix, '').toLowerCase();
      result[name] = obj[key];
    }
  }
  return result;
}

module.exports = {
  flags,

  apply(argv) {
    const result = Object.assign({}, argv);
    const https = parseGroup(argv, 'https');
    const open = parseGroup(argv, 'open');
    const devMiddleware = argv.devWare || {};
    const hotClient = argv.hotClient || {};

    validate({ argv, flags, prefix: 'serve' });

    if (https) {
      if (https.pass) {
        https.passphrase = https.pass;
        delete https.pass;
      }

      result.https = https;
      delete result.httpsCert;
      delete result.httpsKey;
      delete result.httpsPass;
      delete result.httpsPfx;
    }

    if (open) {
      if (!open.path) {
        open.path = '/';
      }
      result.open = open;
      delete result.openApp;
      delete result.openPath;
    }

    if (argv.devWare) {
      result.devMiddleware = argv.devWare;
      delete result.devWare;
    }

    if (argv.hotClient === false) {
      hotClient.hmr = false;
    } else {
      if (argv.hmr === false) {
        hotClient.hmr = false;
      }

      if (argv.reload === false) {
        hotClient.reload = false;
        delete result.reload;
      }
    }

    delete result.hmr;

    if (argv.logLevel) {
      devMiddleware.logLevel = result.logLevel;
      hotClient.logLevel = result.logLevel;
    }

    if (argv.logTime) {
      devMiddleware.logTime = true;
      hotClient.logTime = true;
    }

    if (Object.keys(devMiddleware).length) {
      result.devMiddleware = devMiddleware;
    }

    if (Object.keys(hotClient).length) {
      result.hotClient = hotClient;
    }

    return result;
  },
};
