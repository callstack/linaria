/*
  Copyright © 2018 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
/* eslint-disable no-param-reassign */
const crypto = require('crypto');
const { symlinkSync } = require('fs');
const { basename, join, resolve } = require('path');

const isCwd = require('is-path-cwd');
const readPkgUp = require('read-pkg-up');
const rm = require('rimraf');
const { WebpackPluginRamdisk } = require('webpack-plugin-ramdisk');

const { PluginExistsError, RamdiskPathError } = require('../errors');

module.exports = {
  init(compiler) {
    const hasPlugin = compiler.options.plugins.some(
      (plugin) => plugin instanceof WebpackPluginRamdisk
    );

    /* istanbul ignore if */
    if (hasPlugin) {
      this.log.error(
        'webpack-plugin-serve adds WebpackRamdiskPlugin automatically. Please remove it from your config.'
      );
      throw new PluginExistsError('WebpackRamdiskPlugin exists in the specified configuration.');
    }

    const pkg = readPkgUp.sync() || {};
    const { path } = compiler.options.output;
    const lastSegment = basename(path);
    const errorInfo = `The ramdisk option creates a symlink from \`output.path\`, to the ramdisk build output path, and must remove any existing \`output.path\` to do so.`;

    // if output.path is /batman/batcave, and the user is running the build with wsp from
    // /batman/batcave, then the process will try and delete cwd, which we don't want for a number
    // of reasons
    // console.log('output.path:', resolve(path));
    // console.log('process.cwd:', process.cwd());
    if (isCwd(path)) {
      throw new RamdiskPathError(
        `Cannot remove current working directory. ${errorInfo} Please run from another path, or choose a different \`output.path\`.`
      );
    }

    // if output.path is /batman/batcave, and the compiler context is not set and cwd is
    // /batman/batcave, or the context is the same as output.path, then the process will try and
    // delete the context directory, which probably contains src, configs, etc. throw an error
    // and be overly cautious rather than let the user do something bad. oddly enough, webpack
    // doesn't protect against context === output.path.
    if (resolve(compiler.context) === resolve(path)) {
      throw new RamdiskPathError(
        `Cannot remove ${path}. ${errorInfo} Please set the \`context\` to a another path, choose a different \`output.path\`.`
      );
    }

    if (!pkg.name) {
      // use md5 for a short hash that'll be consistent between wps starts
      const md5 = crypto.createHash('md5');
      md5.update(path);
      pkg.name = md5.digest('hex');
    }

    const newPath = join(pkg.name, lastSegment);

    // clean up the output path in prep for the ramdisk plugin
    compiler.options.output.path = newPath;

    this.log.info(`Ramdisk enabled`);

    const plugin = new WebpackPluginRamdisk({ name: 'wps' });
    plugin.apply(compiler);

    rm.sync(path);

    symlinkSync(compiler.options.output.path, path);
  }
};
