module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-flow',
    '@babel/preset-react',
    [require.resolve('../src/babel'), { evaluate: true }],
  ],
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
      presets: [['@babel/preset-env', { targets: { node: 8 } }]],
    },
  },
};
