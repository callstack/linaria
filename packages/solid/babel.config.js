module.exports = {
  extends: '../../babel.config',
  overrides: [
    {
      test: /\/(__tests__)\//,
      presets: ['@linaria', 'solid'],
    },
  ],
};
