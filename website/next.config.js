module.exports = {
  webpack: (config, { dev }) => ({
    ...config,
    module: {
      rules: [
        ...config.module.rules,
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
  }),
};
