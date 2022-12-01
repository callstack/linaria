module.exports = {
  extends: '../../babel.config',
  overrides: [
    {
      test: ['__tests__/**/*.tsx'],
      presets: ['@babel/preset-react'],
    },
  ],
};
