module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-flow', '@babel/preset-react'],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          linaria: '../src',
        },
      },
    ],
  ],
  env: {
    server: {
      presets: [
        ['@babel/preset-env', { targets: { node: 8 } }],
        require.resolve('../src/babel'),
      ],
    },
  },
};
