/*
  Copyright © 2018 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
const chalk = require('chalk');
const decamelize = require('decamelize');
const objectPath = require('object-path');

const custom = ['clientAddress', 'clientRetry', 'clientSilent'];
const allowed = ['_', 'all', 'config', 'help', 'silent', 'version'];
const plugin = [
  'compress',
  'historyFallback',
  'hmr',
  'host',
  'http2',
  'liveReload',
  'open',
  'port',
  'progress',
  'static',
  'status',
  'waitForBuild'
];

module.exports = {
  check(flags) {
    const validFlags = [].concat(allowed, custom, plugin);
    // eslint-disable-next-line no-bitwise
    const userFlags = Object.keys(flags).filter((flag) => flag.indexOf('-') === -1);
    const deprecated = userFlags
      .filter((flag) => !validFlags.includes(flag))
      .map((flag) => decamelize(flag, '-'));

    if (deprecated.length) {
      const { error: stderr } = console;

      stderr(chalk`{yellow ˢᵉʳᵛᵉ} Some options were passed which are unsupported:

  {blue --${deprecated.join('\n  --')}}

  {dim Please run {reset webpack-serve --help} for a list of supported flags.}
`);
    }
  },

  prepare(flags) {
    const result = {};

    for (const flag of Object.keys(flags)) {
      const value = flags[flag];
      if (plugin.includes(flag)) {
        result[flag] = value;
      }

      if (custom.includes(flag)) {
        const path = decamelize(flag, '.');
        objectPath.set(result, path, value);
      }
    }

    return result;
  }
};
