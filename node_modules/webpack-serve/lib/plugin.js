/*
  Copyright © 2018 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
/* eslint-disable no-param-reassign */
const { dirname } = require('path');

const isObject = require('is-plain-obj');
const pkgConf = require('pkg-conf');
const { WebpackPluginServe } = require('webpack-plugin-serve');

const { prepare } = require('./flags');

const applyEntry = (entry) => {
  const pluginEntry = 'webpack-plugin-serve/client';

  if (Array.isArray(entry)) {
    entry.push(pluginEntry);
  } else if (isObject(entry)) {
    const keys = Object.keys(entry);
    for (const key of keys) {
      entry[key] = applyEntry(entry[key]);
    }
  } else {
    entry = [entry, pluginEntry];
  }

  return entry;
};

const applyPlugin = (config, flags, plugin, attach = false) => {
  const isEmpty = Object.keys(config).length === 0;

  if (!config.plugins) {
    config.plugins = [];
  }

  config.plugins.push(attach ? plugin.attach() : plugin);

  if (isEmpty) {
    config.entry = ['./src'];
  }

  // apply watch only if hmr or liveReload is on, if it's the first config, and if --no-watch is not
  // specified
  if (!attach && flags.watch !== false) {
    config.watch = true;
  }

  config.entry = applyEntry(config.entry);

  return config;
};

const apply = async (config, flags, configPath) => {
  const flagOptions = prepare(flags);
  const pkgConfig = await pkgConf('serve', { cwd: dirname(configPath) });
  const options = Object.assign({}, pkgConfig, flagOptions);
  const plugin = new WebpackPluginServe(options);

  if (flags.all) {
    if (Array.isArray(config)) {
      config = config.map((c, index) => applyPlugin(c, flags, plugin, index > 0));
    } else {
      config = applyPlugin(config, flags, plugin);
    }
  } else {
    [config] = [].concat(config);
    config = applyPlugin(config, flags, plugin);
  }

  return config;
};

module.exports = { apply };
