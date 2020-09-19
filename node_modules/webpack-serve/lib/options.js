const { readFileSync, lstatSync } = require('fs');
const { resolve } = require('path');

const merge = require('merge-options').bind({ concatArrays: true });
const nodeVersion = require('node-version');
const weblog = require('webpack-log');

const { load } = require('./config');
const { apply: applyFlags } = require('./flags');

// commented-out properties are there for documentation purposes and to display
// the structure of top-level properties (because reminders are helpful)
const defaults = {
  clipboard: true,
  compiler: null,
  config: {},
  content: [],
  devMiddleware: { publicPath: '/' },
  host: 'localhost',
  // hotClient: {},
  http2: false,
  https: null,
  // https: {
  //   key: fs.readFileSync('...key'),
  //   cert: fs.readFileSync('...cert'),
  //   pfx: ...,
  //   passphrase: ...
  // },
  logLevel: 'info',
  logTime: false,
  open: false,
  // open: { app: <String>, path: <String> }
  port: 8080,
  protocol: 'http',
};

module.exports = {
  apply(argv, configs, opts) {
    const flags = applyFlags(argv);
    const [first] = configs;
    const options = merge({}, defaults, opts, flags, first.serve);
    const { https } = options;
    const { hotClient } = options;

    weblog({
      id: 'webpack-serve',
      level: options.logLevel,
      name: 'serve',
      timestamp: options.logTime,
    });

    if (typeof options.content === 'string') {
      options.content = [options.content];
    }

    if (!options.content || !options.content.length) {
      // if no context was specified in a config, and no --content options was
      // used, then we need to derive the context, and content location, from
      // the compiler.
      if (first.context) {
        options.content = [first.context];
      } else {
        options.content = [process.cwd()];
      }
    }

    /* istanbul ignore if */
    if (
      options.http2 &&
      /* istanbul ignore next */ (nodeVersion.major < 8 ||
        (nodeVersion.minor === 8 && nodeVersion.minor < 8))
    ) {
      throw new TypeError(
        'webpack-serve: The `http2` option can only be used with Node v8.8.0 and higher.'
      );
    }

    // because you just know someone is going to try `true`
    /* istanbul ignore else */
    if (hotClient === true || typeof hotClient === 'undefined') {
      options.hotClient = { host: options.host };
    } else if (!hotClient.host) {
      options.hotClient.host = options.host;
    }

    if (https) {
      for (const property of ['cert', 'key', 'pfx']) {
        const value = https[property];
        const isBuffer = value instanceof Buffer;

        if (value && !isBuffer) {
          // lstat seems to have a hard limit at 260
          /* istanbul ignore else */
          if (value.length < 260 && lstatSync(value).isFile()) {
            https[property] = readFileSync(resolve(value));
          }
        }
      }

      if (https.pass) {
        https.passphrase = https.pass;
        delete https.pass;
      }

      options.protocol = 'https';
      options.https = https;
    }

    // cleanup - doing this here so as not to mutate the options passed in.
    delete options.config;

    return { configs, options };
  },

  getOptions(argv, opts) {
    const { apply } = module.exports;

    return load(argv, opts).then((configs) => apply(argv, configs, opts));
  },
};
