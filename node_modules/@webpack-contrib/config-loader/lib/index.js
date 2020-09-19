const merge = require('merge-options');
const webpackLog = require('webpack-log');
const validate = require('@webpack-contrib/schema-utils');
const webpackSchema = require('webpack/schemas/WebpackOptions.json');

const { extend } = require('./extend');
const load = require('./load');
const resolve = require('./resolve');

module.exports = (options = {}) => {
  webpackLog({ name: 'config', id: 'webpack-config-loader' });

  const name = 'config-loader';
  const raw = load(options);
  const schema = merge({}, options.schema, webpackSchema);

  return resolve(raw).then((result) => {
    const { config, configPath } = result;

    return extend(config).then((finalConfig) => {
      // finalConfig may be a single Object or it may be an Array[Object]
      // for simplicity, concat into an array and treat both types the same.
      for (const target of [].concat(finalConfig)) {
        validate({ name, schema, target });
      }
      return { config: finalConfig, configPath };
    });
  });
};
