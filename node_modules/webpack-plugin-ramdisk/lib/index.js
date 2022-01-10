/*
  Copyright © 2019 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
const { join } = require('path');

const chalk = require('chalk');

const { cleanup, init } = require('./ramdisk');
const { validate } = require('./validate');

const defaults = {
  blockSize: 512,
  // 256 mb
  bytes: 2.56e8,
  name: 'wpr'
};
const { error, info } = console;
const key = 'webpack-plugin-ramdisk';
const name = 'WebpackPluginRamdisk';

class WebpackPluginRamdisk {
  constructor(opts = {}) {
    const valid = validate(opts);

    /* istanbul ignore if */
    if (valid.error) {
      error(chalk.red(`⬢ ${key}:`), `An option was passed to ${name} that is not valid`);
      throw valid.error;
    }

    const options = Object.assign({}, defaults, opts);
    const diskPath = init(options);

    this.diskPath = diskPath;
    this.options = options;
  }

  apply(compiler) {
    const { output } = compiler.options;
    const outputPath = join(this.diskPath, output.path || 'dist');

    /* eslint-disable no-param-reassign */
    compiler.options.output = Object.assign({}, compiler.options.output, { path: outputPath });
    compiler.outputPath = compiler.options.output.path;
    this.outputPath = compiler.outputPath;

    info(chalk.blue(`⬡ ${key}:`), `Build being written to ${outputPath}`);
  }

  static cleanup(diskPath) {
    return cleanup(diskPath);
  }
}

module.exports = { defaults, WebpackPluginRamdisk };
