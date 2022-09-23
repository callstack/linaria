module.exports = {
  extends: ['stylelint-config-standard'],
  // eslint-disable-next-line global-require
  customSyntax: require('@linaria/postcss-linaria'),
  rules: {
    'property-no-vendor-prefix': true,
    'string-no-newline': true,
    'value-no-vendor-prefix': true,
    'no-empty-source': null,
    'no-extra-semicolons': null,
    // /* pcss-lin */ placeholder comments are added during parsing
    'comment-empty-line-before': [
      'always',
      {
        except: ['first-nested'],
        ignore: ['stylelint-commands'],
        ignoreComments: [/pcss-lin/],
      },
    ],
    //  '//' comments create unknown word issues while linting. Force using /* */
    'no-invalid-double-slash-comments': true,
  },
};
