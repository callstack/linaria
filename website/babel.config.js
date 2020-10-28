module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-flow', '@babel/preset-react'],
  env: {
    server: {
      presets: [
        ['@babel/preset-env', { targets: { node: 8 } }],
        require.resolve('@linaria/babel'),
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
