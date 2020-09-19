/*
  Copyright © 2016 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
const { join } = require('path');

const root = require('app-root-path');
const chalk = require('chalk');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');

const { getClient } = require('./client');
const { getMiddleware } = require('./middleware');
const { validate } = require('./validate');

const defaults = { devMiddleware: {}, hotClient: {} };

module.exports = async (opts) => {
  const valid = validate(opts);

  if (valid.error) {
    const { error } = console;
    error(chalk.red('⬢ koa-webpack:'), 'An option was passed to koa-webpack that is not valid');
    throw valid.error;
  }

  const options = Object.assign({}, defaults, opts);

  let { compiler, config } = options;

  if (!compiler) {
    if (!config) {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      config = require(options.configPath || join(root.path, 'webpack.config.js'));
    }

    compiler = webpack(config);
  }

  if (!options.devMiddleware.publicPath) {
    const { publicPath } = compiler.options.output;

    if (!publicPath) {
      throw new Error(
        "koa-webpack: publicPath must be set on `dev` options, or in a compiler's `output` configuration."
      );
    }

    options.devMiddleware.publicPath = publicPath;
  }

  const hotClient = await getClient(compiler, options);
  const devMiddleware = webpackDevMiddleware(compiler, options.devMiddleware);
  const middleware = getMiddleware(compiler, devMiddleware);
  const close = (callback) => {
    const next = hotClient ? () => hotClient.close(callback) : callback;
    devMiddleware.close(next);
  };

  return Object.assign(middleware, {
    hotClient,
    devMiddleware,
    close
  });
};
