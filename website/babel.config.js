module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-react'],
  env: {
    server: {
      presets: [
        require.resolve('@wyw-in-js/babel-preset'),
        ['@babel/preset-env', { targets: { node: 12 } }],
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
