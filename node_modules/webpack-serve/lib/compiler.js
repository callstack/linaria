/*
  Copyright © 2018 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
const chalk = require('chalk');
const webpack = require('webpack');

const run = ({ config, watchConfig }, log) => {
  let lastHash;
  const compiler = webpack(config);

  const done = (fatal, stats) => {
    const hasErrors = stats && stats.hasErrors();

    process.exitCode = Number(!!fatal || (hasErrors && !watchConfig));

    if (fatal) {
      log.error(fatal);
      return;
    }

    if (lastHash === stats.hash) {
      log.info(chalk`{dim ˢᵉʳᵛᵉ} Duplicate build detected {dim (${lastHash})}\n`);
      return;
    }

    lastHash = stats.hash;

    const statsDefaults = { colors: chalk.supportsColor.hasBasic, exclude: ['node_modules'] };
    const { options = {} } =
      []
        .concat(compiler.compilers || compiler)
        .reduce((a, c) => c.options.stats && c.options.stats) || {};
    const statsOptions =
      !options.stats || typeof options.stats === 'object'
        ? Object.assign({}, statsDefaults, options.stats)
        : options.stats;
    const result = stats.toString(statsOptions);

    // indent the result slightly to visually set it apart from other output
    log.info(result.split('\n').join('\n  '), '\n');
  };

  if (watchConfig) {
    log.info('Watching Files');
    compiler.watch(watchConfig.watchOptions || {}, done);
  } else {
    compiler.hooks.done.tap('webpack-serve', () => log.info('Build Finished'));
    compiler.run(done);
  }
};

module.exports = { run };
