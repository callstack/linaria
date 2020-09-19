const chalk = require('chalk');
const cosmiconfig = require('cosmiconfig');
const resolvePath = require('resolve').sync;
const webpackLog = require('webpack-log');

const LoadConfigError = require('./LoadConfigError');
const RequireModuleError = require('./RequireModuleError');

const cwd = process.cwd();
const { loadJs } = cosmiconfig;
const prefix = 'webpack';
const cosmicOptions = {
  loaders: {
    '.es6': loadJs,
    '.flow': loadJs,
    '.mjs': loadJs,
    '.ts': loadJs,
  },
  searchPlaces: [
    `${prefix}.config.js`,
    `${prefix}.config.es6`,
    `${prefix}.config.flow`,
    `${prefix}.config.mjs`,
    `${prefix}.config.ts`,
    `.${prefix}rc`,
    'package.json',
    `.${prefix}rc.json`,
    `.${prefix}rc.yaml`,
    `.${prefix}rc.yml`,
  ],
};

module.exports = (options = {}) => {
  const log = webpackLog({ name: 'config', id: 'webpack-config-loader' });
  const requires = [].concat(options.require).filter((r) => !!r);

  // eslint-disable-next-line no-param-reassign
  options = Object.assign({ cwd: process.cwd() }, options);

  for (const module of requires) {
    try {
      const modulePath = resolvePath(module, { basedir: cwd });

      log.info(chalk`Requiring the {cyan ${module}} module`);

      if (options.requireOptions) {
        const { requireOptions } = options;
        // eslint-disable-next-line import/no-dynamic-require, global-require
        require(modulePath)(requireOptions);
      } else {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        require(modulePath);
      }
    } catch (e) {
      log.error(chalk`An error occurred while requiring: {grey ${module}}`);
      throw new RequireModuleError(e, module);
    }
  }

  let config = {};
  let { configPath } = options;

  const explorer = cosmiconfig(prefix, cosmicOptions);

  try {
    let result;
    if (configPath) {
      result = explorer.loadSync(configPath) || {};
    } else {
      result = explorer.searchSync(options.cwd) || {};
    }

    ({ config, filepath: configPath } = result);

    log.debug(chalk`Found config at {grey ${configPath}}`);
  } catch (e) {
    /* istanbul ignore else */
    if (configPath) {
      log.error(chalk`An error occurred while trying to load {grey ${configPath}}
              Did you forget to specify a --require?`);
    } else {
      log.error(chalk`An error occurred while trying to find a config file
              Did you forget to specify a --require?`);
    }
    throw new LoadConfigError(e, configPath);
  }

  if (!configPath && !options.allowMissing) {
    // prettier-ignore
    log.error(chalk`Unable to load a config from: {grey ${options.cwd}}`);
    const e = new Error(`Unable to load a config from: ${options.cwd}`);
    throw new LoadConfigError(e, configPath);
  } else {
    config = config || {};
    configPath = configPath || '';
  }

  return { config, configPath };
};
