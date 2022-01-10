/*
  Copyright © 2018 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
const EventEmitter = require('events');

const globby = require('globby');
const Koa = require('koa');
const nanoid = require('nanoid/generate');
const { DefinePlugin, ProgressPlugin } = require('webpack');

const { init: initHmrPlugin } = require('./plugins/hmr');
const { init: initRamdiskPlugin } = require('./plugins/ramdisk');
const { forceError, getLogger } = require('./log');
const { start } = require('./server');
const { validate } = require('./validate');

const defaults = {
  // leave `client` undefined
  // client: null,
  compress: null,
  headers: null,
  historyFallback: false,
  hmr: true,
  host: null,
  liveReload: false,
  log: { level: 'info' },
  middleware: () => {},
  open: false,
  port: 55555,
  progress: true,
  ramdisk: false,
  secure: false,
  static: null,
  status: true
};

const key = 'webpack-plugin-serve';
const newline = () => console.log(); // eslint-disable-line no-console

let instance = null;

// TODO: test this on a multicompiler setup
class WebpackPluginServe extends EventEmitter {
  constructor(opts = {}) {
    super();

    const valid = validate(opts);

    if (valid.error) {
      forceError('An option was passed to WebpackPluginServe that is not valid');
      throw valid.error;
    }

    // NOTE: undocumented option. this is used primarily in testing to allow for multiple instances
    // of the plugin to be tested within the same context. If you find this, use this at your own
    // peril.
    /* istanbul ignore if */
    if (!opts.allowMany && instance) {
      instance.log.error(
        'Duplicate instances created. Only the first instance of this plugin will be active.'
      );
      return;
    }

    instance = this;

    const options = Object.assign({}, defaults, opts);

    if (options.compress === true) {
      options.compress = {};
    }

    if (options.historyFallback === true) {
      options.historyFallback = {};
    }

    // if the user has set this to a string, rewire it as a function
    // host and port are setup like this to allow passing a function for each to the options, which
    // returns a promise
    if (typeof options.host === 'string') {
      const { host } = options;
      options.host = {
        then(r) {
          r(host);
        }
      };
    }

    if (Number.isInteger(options.port)) {
      const { port } = options;
      options.port = {
        then(r) {
          r(port);
        }
      };
    }

    if (!options.static) {
      options.static = [];
    } else if (options.static.glob) {
      const { glob, options: globOptions = {} } = options.static;
      options.static = globby.sync(glob, globOptions);
    }

    this.app = new Koa();
    this.log = getLogger(options.log || {});
    this.options = options;
    this.compilers = [];
    this.state = {};
  }

  apply(compiler) {
    this.compiler = compiler;

    // only allow once instance of the plugin to run for a build
    /* istanbul ignore if */
    if (instance !== this) {
      return;
    }

    this.hook(compiler);
  }

  // eslint-disable-next-line class-methods-use-this
  attach() {
    const self = this;
    const result = {
      apply(compiler) {
        return self.hook(compiler);
      }
    };
    return result;
  }

  // #138. handle emitted events that don't have a listener registered so they can be sent via WebSocket
  emit(eventName, ...args) {
    const listeners = this.eventNames();

    if (listeners.includes(eventName)) {
      super.emit(eventName, ...args);
    } else {
      // #144. don't send the watchClose event to the client
      if (eventName === 'close') {
        return;
      }
      const [data] = args;
      super.emit('unhandled', { eventName, data });
    }
  }

  hook(compiler) {
    const { done, invalid, watchClose, watchRun } = compiler.hooks;

    if (!compiler.wpsId) {
      // eslint-disable-next-line no-param-reassign
      compiler.wpsId = nanoid('1234567890abcdef', 7);
    }

    if (!compiler.name && !compiler.options.name) {
      // eslint-disable-next-line no-param-reassign
      compiler.options.name = this.compilers.length.toString();
      this.compilers.push(compiler);
    }

    if (this.options.hmr) {
      initHmrPlugin(compiler, this.log);
    }

    if (this.options.ramdisk) {
      initRamdiskPlugin.call(this, compiler);
    }

    if (!this.options.static.length) {
      this.options.static.push(compiler.context);
    }

    // we do this emit because webpack caches and optimizes the hooks, so there's no way to detach
    // a listener/hook.
    done.tap(key, (stats) => this.emit('done', stats, compiler));
    invalid.tap(key, (filePath) => this.emit('invalid', filePath, compiler));
    watchClose.tap(key, () => this.emit('close', compiler));

    if (this.options.waitForBuild) {
      // track the first build of the bundle
      this.state.compiling = new Promise((resolve) => {
        this.once('done', () => resolve());
      });

      // track subsequent builds from watching
      this.on('invalid', () => {
        /* istanbul ignore next */
        this.state.compiling = new Promise((resolve) => {
          this.once('done', () => resolve());
        });
      });
    }

    compiler.hooks.compilation.tap(key, (compilation) => {
      compilation.hooks.afterHash.tap(key, () => {
        // webpack still has a 4 year old bug whereby in watch mode, file timestamps aren't properly
        // accounted for, which will trigger multiple builds of the same hash.
        // see: https://github.com/egoist/time-fix-plugin
        /* istanbul ignore if */
        if (this.lastHash === compilation.hash) {
          return;
        }
        this.lastHash = compilation.hash;
        this.emit('build', compiler.name, compiler);
      });
    });

    watchRun.tapPromise(key, async () => {
      if (!this.state.starting) {
        // ensure we're only trying to start the server once
        this.state.starting = start.bind(this)();
        this.state.starting.then(() => newline());
      }

      // wait for the server to startup so we can get our client connection info from it
      await this.state.starting;

      const compilerData = {
        // only set the compiler name if we're dealing with more than one compiler. otherwise, the
        // user doesn't need the additional feedback in the console
        compilerName: this.compilers.length > 1 ? compiler.options.name : null,
        wpsId: compiler.wpsId
      };

      const defineObject = Object.assign({}, this.options, compilerData);
      const defineData = { ʎɐɹɔosǝʌɹǝs: JSON.stringify(defineObject) };
      const definePlugin = new DefinePlugin(defineData);

      definePlugin.apply(compiler);

      if (this.options.progress) {
        const progressPlugin = new ProgressPlugin((percent, message, misc) => {
          // pass the data onto the client raw. connected sockets may want to interpret the data
          // differently
          this.emit('progress', { percent, message, misc }, compiler);
        });

        progressPlugin.apply(compiler);
      }
    });
  }
}

module.exports = { defaults, WebpackPluginServe };
