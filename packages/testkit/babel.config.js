module.exports = {
  extends: '../../babel.config',
  overrides: [
    {
      test: 'src',
      presets: ['@babel/preset-react'],
    },
  ],
};
