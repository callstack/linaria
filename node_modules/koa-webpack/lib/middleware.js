/*
  Copyright © 2016 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
module.exports = {
  getMiddleware(compiler, devMiddleware) {
    return (context, next) => {
      // wait for webpack-dev-middleware to signal that the build is ready
      const ready = new Promise((resolve, reject) => {
        for (const comp of [].concat(compiler.compilers || compiler)) {
          comp.hooks.failed.tap('KoaWebpack', (error) => {
            reject(error);
          });
        }

        devMiddleware.waitUntilValid(() => {
          resolve(true);
        });
      });
      // tell webpack-dev-middleware to handle the request
      const init = new Promise((resolve) => {
        devMiddleware(
          context.req,
          {
            end: (content) => {
              // eslint-disable-next-line no-param-reassign
              context.body = content;
              resolve();
            },
            getHeader: context.get.bind(context),
            setHeader: context.set.bind(context),
            locals: context.state
          },
          () => resolve(next())
        );
      });

      return Promise.all([ready, init]);
    };
  }
};
