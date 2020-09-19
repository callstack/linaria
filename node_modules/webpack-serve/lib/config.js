const { isAbsolute, resolve } = require('path');

const loader = require('@webpack-contrib/config-loader');
const isPlainObject = require('is-plain-obj');
const TimeFixPlugin = require('time-fix-plugin');
const { MultiCompiler } = require('webpack');

// automagically wrap hot-client-invalid entry values in an array
function toArray(config) {
  const result = config;

  if (typeof result.entry === 'string') {
    result.entry = [result.entry];
  } else if (typeof result.entry === 'undefined') {
    // webpack v4 defaults an empty config to { entry: './src' }. but since we
    // need an array, we'll mimic that default config.
    result.entry = ['./src'];
  } else if (isPlainObject(result.entry)) {
    for (const key of Object.keys(result.entry)) {
      const entry = result.entry[key];

      if (!Array.isArray(entry)) {
        result.entry[key] = [entry];
      }
    }
  }

  return result;
}

// adds https://github.com/egoist/time-fix-plugin if not already added
// to the config.
function timeFix(config) {
  const result = config;

  if (result.plugins) {
    let timeFixFound = false;
    for (const plugin of result.plugins) {
      if (!timeFixFound && plugin instanceof TimeFixPlugin) {
        timeFixFound = true;
      }
    }

    if (!timeFixFound) {
      result.plugins.unshift(new TimeFixPlugin());
    }
  } else {
    result.plugins = [new TimeFixPlugin()];
  }

  return result;
}

function prepare(config) {
  return timeFix(toArray(config));
}

module.exports = {
  prepare,
  timeFix,
  toArray,

  load(argv = {}, options) {
    const { compiler } = options;
    const config = argv.config || options.config;
    const require = argv.require || options.require;

    // if someone passed us a config Object, then just resolve that object
    // we're only going to load the config from file when we're given a file
    // to load
    if (isPlainObject(config) || Array.isArray(config)) {
      const result = [].concat(config).map((conf) => prepare(conf));
      return Promise.resolve(result);
    }

    // if a user has passed us a compiler directly, then pull the config from
    // the compiler and use that
    if (compiler) {
      let configs = [];
      if (compiler instanceof MultiCompiler) {
        const { compilers } = compiler;
        configs = compilers.map((c) => c.options);
      } else {
        configs = [compiler.options];
      }

      return Promise.resolve(configs);
    }

    const loaderOptions = {
      allowMissing: true,
      require,
      schema: {
        properties: {
          serve: {
            additionalProperties: true,
            type: 'object',
          },
        },
      },
    };

    if (typeof config === 'string') {
      if (isAbsolute(config)) {
        loaderOptions.configPath = config;
      } else {
        loaderOptions.configPath = resolve(process.cwd(), config);
      }
    }

    return loader(loaderOptions).then((result) => {
      let found = result.config;

      if (!result.configPath) {
        // webpack v4+ defaults an empty config to { entry: './src' }. but since we
        // need an array, we'll mimic that default config.
        found = { entry: ['./src'] };
      }

      found = [].concat(found).map((conf) => prepare(conf));

      return found;
    });
  },
};
