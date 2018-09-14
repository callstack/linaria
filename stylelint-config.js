module.exports = {
  processors: [require.resolve('./stylelint-preprocessor.js')],
  syntax: 'scss',
  extends: 'stylelint-config-recommended',
  rules: {
    'at-rule-name-case': 'lower',
    'unit-case': 'lower',
    'no-empty-source': null,
    'no-extra-semicolons': null,
  },
};
