export default {
  processors: [require.resolve('./preprocessor')],
  syntax: 'scss',
  rules: {
    'property-no-vendor-prefix': true,
    'string-no-newline': true,
    'value-no-vendor-prefix': true,
    'no-empty-source': null,
    'no-extra-semicolons': null,
  },
};
