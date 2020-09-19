const { relative, sep } = require('path');

const statik = require('@shellscape/koa-static/legacy');
const chalk = require('chalk');
const weblog = require('webpack-log');

const MiddlewareState = require('./MiddlewareState');

module.exports = class ContentMiddleware extends MiddlewareState {
  constructor(app, options) {
    super();

    this.app = app;
    this.options = options;
  }

  call(staticOptions = {}) {
    const log = weblog({ id: 'webpack-serve', name: 'serve' });
    const { content } = this.options;
    const paths = content
      .map((dir) => chalk.grey(relative(process.cwd(), dir) + sep))
      .sort()
      .join(`\n             `);

    for (const dir of content) {
      this.app.use(statik(dir, staticOptions));
    }

    log.info(`Serving Static Content from: ${paths}`);

    this.deferred.resolve();

    return this.state;
  }
};
