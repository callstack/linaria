const koaWebpack = require('koa-webpack');

const { getServer } = require('../server');
const WebpackServeError = require('../WebpackServeError');

const MiddlewareState = require('./MiddlewareState');

module.exports = class WebpackMiddleware extends MiddlewareState {
  constructor(app, options) {
    super();
    this.app = app;
    this.options = options;
  }

  call() {
    const { options } = this;
    const koaWebpackOpts = {
      compiler: options.compiler,
      devMiddleware: options.devMiddleware,
      hotClient: options.hotClient,
    };
    let server = null;

    if (options.https) {
      server = getServer(null, options);
      koaWebpackOpts.hotClient.server = server;
    }

    return koaWebpack(koaWebpackOpts)
      .then((middleware) => {
        this.koaMiddleware = middleware;
        this.app.use(middleware);
        this.deferred.resolve(this.koaMiddleware);

        if (server) {
          const og = middleware.close;
          // eslint-disable-next-line no-param-reassign
          middleware.close = (callback) => {
            server.kill(og(callback));
          };
        }

        return middleware;
      })
      .catch((e) => {
        // this looks weird, but for ease of use we always want to resolve.
        // we'll check the resolved value down the pipe
        this.deferred.resolve(e);
        throw new WebpackServeError(
          `An error was thrown while initializing koa-webpack\n ${e.stack}`
        );
      });
  }
};
