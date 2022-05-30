module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-react'],
  env: {
    server: {
      presets: [
        ['@babel/preset-env', { targets: { node: 8 } }],
        require.resolve('@linaria/babel-preset'),
      ],
      plugins: [
        [
          'file-loader',
          {
            publicPath: '/dist',
            outputPath: '/dist',
          },
        ],
      ],
    },
  },
};
