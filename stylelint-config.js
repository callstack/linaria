module.exports = {
  processors: [require.resolve('./stylelint-preprocessor.js')],
  syntax: 'scss',
  extends: 'stylelint-config-recommended',
  rules: {
    'at-rule-name-case': 'lower',
    'unit-case': 'lower',
    'at-rule-semicolon-newline-after': 'always',
    'max-empty-lines': 1,
    'no-empty-source': null,
    'length-zero-no-unit': true,
    'no-extra-semicolons': null,
  },
};
