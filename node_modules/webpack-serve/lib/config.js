/*
  Copyright © 2018 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
const { existsSync } = require('fs');
const { resolve } = require('path');

const rechoir = require('rechoir');

const { apply } = require('./plugin');

const fileTypes = {
  '.babel.js': ['@babel/register', 'babel-register', 'babel-core/register', 'babel/register'],
  '.babel.ts': ['@babel/register'],
  '.es6': ['@babel/register'],
  '.mjs': ['@babel/register'],
  '.ts': [
    'ts-node/register',
    'typescript-node/register',
    'typescript-register',
    'typescript-require'
  ]
};
const configTypes = {
  function: (c, argv) => Promise.resolve(c(argv.env || {}, argv)),
  object: (c) => Promise.resolve(c)
};
const cwd = process.cwd();
const defaultConfigPath = resolve(cwd, 'webpack.config.js');

const requireLoader = (extension) => {
  try {
    rechoir.prepare(fileTypes, `config${extension}`, cwd);
  } catch (e) {
    let message;
    if (/no module loader/i.test(e.message)) {
      const [, fileType] = e.message.match(/(".+").$/);
      message = `A loader could not be found for the ${fileType} file type`;
    } else {
      const modules = e.failures.map(({ moduleName }) => `\n    ${moduleName}`);
      message = `${e.message.slice(0, -1)}:${modules}`;
    }

    const error = new RangeError(message);
    error.code = 'ERR_MODULE_LOADER';
    throw error;
  }
};

const loadConfig = async (argv) => {
  if (!argv.config && existsSync(defaultConfigPath)) {
    // eslint-disable-next-line no-param-reassign
    argv.config = defaultConfigPath;
  }

  // let's not process any config if the user hasn't specified any
  if (argv.config) {
    const configName = typeof argv.config !== 'string' ? Object.keys(argv.config)[0] : null;
    // e.g. --config.batman webpack.config.js
    const configPath = argv.config[configName] || argv.config;
    const resolvedPath = resolve(configPath);

    // only register a loader if the config file extension matches one we support
    const extension = Object.keys(fileTypes).find((t) => resolvedPath.endsWith(t));

    if (extension) {
      requireLoader(extension);
    }

    let configExport = require(resolvedPath); // eslint-disable-line global-require, import/no-dynamic-require

    if (configExport.default) {
      configExport = configExport.default;
    }

    if (configName) {
      if (!Array.isArray(configExport)) {
        throw new TypeError(
          `A config with name was specified, but the config ${configPath} does not export an Array.`
        );
      }

      configExport = configExport.find((c) => c.name === configName);

      if (!configExport) {
        throw new RangeError(`A config with name '${configName}' was not found in ${configPath}`);
      }
    }

    const configType = typeof configExport;
    let config = await configTypes[configType](configExport, argv);
    config = await apply(config, argv, resolvedPath);

    const watchConfig = [].concat(config).find((c) => !!c.watch);
    const result = { config, watchConfig };

    return result;
  }

  return { config: await apply({}, argv, process.cwd()) };
};

module.exports = { loadConfig };
