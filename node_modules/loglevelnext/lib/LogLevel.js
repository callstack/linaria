/*
  Copyright © 2018 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/

const PrefixFactory = require('./factory/PrefixFactory');

const MethodFactory = require('./factory/MethodFactory');

const defaults = {
  factory: null,
  level: 'warn',
  name: +new Date(),
  prefix: null
};

module.exports = class LogLevel {
  constructor(options) {
    // implement for some _very_ loose type checking. avoids getting into a
    // circular require between MethodFactory and LogLevel
    this.type = 'LogLevel';
    this.options = Object.assign({}, defaults, options);
    this.methodFactory = options.factory;

    if (!this.methodFactory) {
      const factory = options.prefix
        ? new PrefixFactory(this, options.prefix)
        : new MethodFactory(this);
      this.methodFactory = factory;
    }

    if (!this.methodFactory.logger) {
      this.methodFactory.logger = this;
    }

    this.name = options.name || '<unknown>';

    // this.level is a setter, do this after setting up the factory
    this.level = this.options.level;
  }

  get factory() {
    return this.methodFactory;
  }

  set factory(factory) {
    // eslint-disable-next-line no-param-reassign
    factory.logger = this;
    this.methodFactory = factory;
    this.methodFactory.replaceMethods(this.level);
  }

  disable() {
    this.level = this.levels.SILENT;
  }

  enable() {
    this.level = this.levels.TRACE;
  }

  get level() {
    return this.currentLevel;
  }

  set level(logLevel) {
    const level = this.methodFactory.distillLevel(logLevel);

    if (level === false || level == null) {
      throw new RangeError(`loglevelnext: setLevel() called with invalid level: ${logLevel}`);
    }

    this.currentLevel = level;
    this.methodFactory.replaceMethods(level);

    if (typeof console === 'undefined' && level < this.levels.SILENT) {
      // eslint-disable-next-line no-console
      console.warn('loglevelnext: console is undefined. The log will produce no output.');
    }
  }

  get levels() {
    // eslint-disable-line class-methods-use-this
    return this.methodFactory.levels;
  }
};
