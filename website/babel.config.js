module.exports = {
  presets: [
    ['@babel/preset-env', { exclude: ['@babel/plugin-transform-regenerator'] }],
    '@babel/preset-react',
    // 'next/babel',
    require.resolve('../lib/babel'),
  ],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          linaria: '../lib',
        },
      },
    ],
  ],
};
