const webpack = require('webpack');

const WebpackServeError = require('./WebpackServeError');

module.exports = {
  getCompiler(configs, options) {
    const { bus } = options;
    let { compiler } = options;

    if (!compiler) {
      try {
        compiler = webpack(configs.length > 1 ? configs : configs[0]);
      } catch (e) {
        throw new WebpackServeError(
          `An error was thrown while initializing Webpack\n  ${e.toString()}`
        );
      }
    }

    const compilers = compiler.compilers || [compiler];

    for (const comp of compilers) {
      comp.hooks.compile.tap('WebpackServe', () => {
        bus.emit('build-started', { compiler: comp });
      });

      comp.hooks.done.tap('WebpackServe', (stats) => {
        const hasErrors = stats.hasErrors();
        const hasWarnings = stats.hasWarnings();
        // stats.toJson() has a high time-cost for large projects
        // only run that if there are listeners AND there are
        // problems with the build (#181)
        if (
          (bus.listeners('compiler-error').length && hasErrors) ||
          (bus.listeners('compiler-warning').length && hasWarnings)
        ) {
          const json = stats.toJson();
          if (hasErrors) {
            bus.emit('compiler-error', { json, compiler: comp });
          }

          /* istanbul ignore else */
          if (hasWarnings) {
            bus.emit('compiler-warning', { json, compiler: comp });
          }
        }

        bus.emit('build-finished', { stats, compiler: comp });
      });
    }

    return compiler;
  },
};
