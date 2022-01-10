/*
  Copyright © 2018 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
const router = require('koa-route');
const stripAnsi = require('strip-ansi');

const prep = (data) => JSON.stringify(data);

const statsOptions = {
  all: false,
  cached: true,
  children: true,
  hash: true,
  modules: true,
  timings: true,
  exclude: ['node_modules', 'bower_components', 'components']
};

const setupRoutes = function setupRoutes() {
  const { app, options } = this;
  const events = ['build', 'done', 'invalid', 'progress'];
  const connect = async (ctx) => {
    if (ctx.ws) {
      const socket = await ctx.ws();
      const send = (data) => {
        if (socket.readyState !== 1) {
          return;
        }
        socket.send(data);
      };

      socket.build = (compilerName = '<unknown>', { wpsId }) => {
        send(prep({ action: 'build', data: { compilerName, wpsId } }));
      };

      socket.done = (stats, { wpsId }) => {
        const { hash } = stats;

        if (socket.lastHash === hash) {
          return;
        }

        send(prep({ action: 'done', data: { hash, wpsId } }));

        socket.lastHash = hash;

        const { errors = [], warnings = [] } = stats.toJson(statsOptions);

        if (errors.length || warnings.length) {
          send(
            prep({
              action: 'problems',
              data: {
                errors: errors.slice(0).map((e) => stripAnsi(e)),
                hash,
                warnings: warnings.slice(0).map((e) => stripAnsi(e)),
                wpsId
              }
            })
          );

          if (errors.length) {
            return;
          }
        }

        if (options.hmr || options.liveReload) {
          const action = options.liveReload ? 'reload' : 'replace';
          send(prep({ action, data: { hash, wpsId } }));
        }
      };

      socket.invalid = (filePath = '<unknown>', compiler) => {
        const context = compiler.context || compiler.options.context || process.cwd();
        const fileName = (filePath.replace && filePath.replace(context, '')) || filePath;
        const { wpsId } = compiler;

        send(prep({ action: 'invalid', data: { fileName, wpsId } }));
      };

      socket.progress = (data) => {
        send(prep({ action: 'progress', data }));
      };

      for (const event of events) {
        this.on(event, socket[event]);

        socket.on('close', () => {
          this.removeListener(event, socket[event]);
        });
      }

      // #138. handle emitted events that don't have a listener registered, and forward the message
      // onto the client via the socket
      this.on('unhandled', ({ eventName, data }) => send(prep({ action: eventName, data })));

      send(prep({ action: 'connected' }));
    }
  };

  app.use(router.get('/wps', connect));
};

module.exports = { setupRoutes };
