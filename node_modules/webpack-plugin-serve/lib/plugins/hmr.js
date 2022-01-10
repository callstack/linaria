/*
  Copyright © 2018 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
const { HotModuleReplacementPlugin } = require('webpack');

const { PluginExistsError } = require('../errors');

const addPlugin = (compiler) => {
  const hmrPlugin = new HotModuleReplacementPlugin();
  hmrPlugin.apply(compiler);
};

const init = function init(compiler, log) {
  // eslint-disable-next-line no-param-reassign
  compiler.options.output = Object.assign(compiler.options.output, {
    hotUpdateChunkFilename: `${compiler.wpsId}-[id]-wps-hmr.js`,
    hotUpdateMainFilename: `${compiler.wpsId}-wps-hmr.json`
  });

  const hasHMRPlugin = compiler.options.plugins.some(
    (plugin) => plugin instanceof HotModuleReplacementPlugin
  );

  /* istanbul ignore else */
  if (!hasHMRPlugin) {
    addPlugin(compiler);
  } else {
    log.error(
      'webpack-plugin-serve adds HotModuleReplacementPlugin automatically. Please remove it from your config.'
    );
    throw new PluginExistsError(
      'HotModuleReplacementPlugin exists in the specified configuration.'
    );
  }
};

module.exports = { init };
