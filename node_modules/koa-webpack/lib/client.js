/*
  Copyright © 2016 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
const webpackHotClient = require('webpack-hot-client');

module.exports = {
  getClient(compiler, options) {
    if (!options.hotClient) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      const client = webpackHotClient(compiler, options.hotClient);
      const { server } = client;

      server.on('listening', () => resolve(client));
    });
  }
};
