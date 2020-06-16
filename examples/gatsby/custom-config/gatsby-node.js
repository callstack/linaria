exports.onCreateWebpackConfig = ({ actions, loaders, getConfig, stage }) => {
  const config = getConfig()

  config.module.rules = [
    ...config.module.rules.filter(
      rule => String(rule.test) !== String(/\.js?$/)
    ),

    {
      ...loaders.js(),

      test: /\.js?$/,
      loader: "linaria/loader",
      options: {
        sourceMap: stage.includes("develop"),
        displayName: stage.includes("develop"),
        babelOptions: {
          presets: ["babel-preset-gatsby"],
        },
      },
      exclude: /node_modules/,
    },
  ]

  actions.replaceWebpackConfig(config)
}
