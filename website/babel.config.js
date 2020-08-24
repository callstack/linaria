module.exports = {
  presets: [
    ['@babel/preset-env', { exclude: ['@babel/plugin-transform-regenerator'] }],
    '@babel/preset-react',
    // 'next/babel',
    'linaria/babel',
  ],
};
