/*
  Copyright © 2018 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
const defer = require('p-defer');
const WebSocket = require('ws');

const socketServer = new WebSocket.Server({ noServer: true });

/* eslint-disable no-param-reassign */
const middleware = async (ctx, next) => {
  const deferred = defer();
  const { upgrade = '' } = ctx.request.headers;
  const upgradable = upgrade
    .split(',')
    .map((header) => header.trim())
    .includes('websocket');

  if (upgradable) {
    ctx.ws = async () => {
      socketServer.handleUpgrade(ctx.req, ctx.request.socket, Buffer.alloc(0), deferred.resolve);
      ctx.respond = false;

      return deferred.promise;
    };
  }

  await next();
};

module.exports = { middleware };
