export default config => {
  const { options, ...babelLoaderRule } = config.module.rules[0];
  options.presets.push('@babel/preset-react', 'linaria/babel');
  config.module.rules[0] = {
    ...babelLoaderRule,
    loader: undefined,
    use: [
      {
        loader: 'babel-loader',
        options,
      },
      {
        loader: 'linaria/loader',
        options: {
          babelOptions: options,
        },
      },
    ],
  };
};
