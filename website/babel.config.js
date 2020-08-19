module.exports = {
  presets: [
    [
      '@babel/preset-env', 
      { exclude: [
        '@babel/plugin-transform-regenerator'
      ]}
    ],
    '@babel/preset-react',
    '@babel/preset-flow',
    // 'next/babel',
    require.resolve('../lib/babel')
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
}
