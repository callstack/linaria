/*
  Copyright © 2018 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
const chalk = require('chalk');
const loglevel = require('loglevelnext');

const symbols = { ok: '⬡', whoops: '⬢' };
const colors = {
  trace: 'cyan',
  debug: 'magenta',
  info: 'blue',
  warn: 'yellow',
  error: 'red'
};

/* istanbul ignore next */
const forceError = (...args) => {
  const { error } = console;
  error(chalk.red(`${symbols.whoops} wps:`), ...args);
};

const getLogger = (options) => {
  const prefix = {
    level: ({ level }) => {
      const color = colors[level];
      /* istanbul ignore next */
      const symbol = ['error', 'warn'].includes(level) ? symbols.whoops : symbols.ok;
      return chalk[color](`${symbol} wps: `);
    },
    template: '{{level}}'
  };

  /* istanbul ignore if */
  if (options.timestamp) {
    prefix.template = `[{{time}}] ${prefix.template}`;
  }

  /* eslint-disable no-param-reassign */
  options.prefix = prefix;
  options.name = 'webpack-plugin-serve';

  const log = loglevel.create(options);

  return log;
};

module.exports = { forceError, getLogger };
