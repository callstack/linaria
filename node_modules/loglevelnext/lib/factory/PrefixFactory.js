/*
  Copyright © 2018 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/

const MethodFactory = require('./MethodFactory');

const defaults = {
  level: (opts) => `[${opts.level}]`,
  name: (opts) => opts.logger.name,
  template: '{{time}} {{level}} ',
  time: () => new Date().toTimeString().split(' ')[0]
};

module.exports = class PrefixFactory extends MethodFactory {
  constructor(logger, options) {
    super(logger);
    this.options = Object.assign({}, defaults, options);
  }

  interpolate(level) {
    return this.options.template.replace(/{{([^{}]*)}}/g, (stache, prop) => {
      const fn = this.options[prop];

      if (fn) {
        return fn({ level, logger: this.logger });
      }

      return stache;
    });
  }

  make(methodName) {
    const og = super.make(methodName);

    return (...args) => {
      const output = this.interpolate(methodName);
      const [first] = args;

      if (typeof first === 'string') {
        // eslint-disable-next-line no-param-reassign
        args[0] = output + first;
      } else {
        args.unshift(output);
      }

      og(...args);
    };
  }
};
