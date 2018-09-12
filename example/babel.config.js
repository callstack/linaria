module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-flow',
    '@babel/preset-react',
    [require.resolve('../src/babel'), { evaluate: true }],
  ],
};
