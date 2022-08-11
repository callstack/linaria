/* eslint-disable no-restricted-syntax */
function crossRules(rules) {
  for (const rule of rules) {
    if (typeof rule.loader === 'string' && rule.loader.includes('css-loader')) {
      if (
        rule.options &&
        rule.options.modules &&
        typeof rule.options.modules.getLocalIdent === 'function'
      ) {
        const nextGetLocalIdent = rule.options.modules.getLocalIdent;
        rule.options.modules.mode = 'local';
        rule.options.modules.auto = true;
        rule.options.modules.exportGlobals = true;
        rule.options.modules.exportOnlyLocals = true;
        rule.options.modules.getLocalIdent = (
          context,
          _,
          exportName,
          options
        ) => {
          if (context.resourcePath.includes('.linaria.module.css')) {
            return exportName;
          }
          return nextGetLocalIdent(context, _, exportName, options);
        };
      }
    }
    if (typeof rule.use === 'object') {
      crossRules(Array.isArray(rule.use) ? rule.use : [rule.use]);
    }
    if (Array.isArray(rule.oneOf)) {
      crossRules(rule.oneOf);
    }
  }
}

module.exports = (nextConfig = {}) => {
  return {
    ...nextConfig,
    webpack(config, options) {
      crossRules(config.module.rules);
      config.module.rules.push({
        test: /\.(tsx|ts|js|mjs|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve('@linaria/webpack-loader'),
            options: {
              sourceMap: process.env.NODE_ENV !== 'production',
              ...(nextConfig.linaria || {}),
              extension: '.linaria.module.css',
            },
          },
        ],
      });

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options);
      }
      return config;
    },
  };
};
