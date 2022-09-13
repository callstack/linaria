import customSyntax from 'postcss-linaria';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config: any = {
  extends: ['stylelint-config-standard'],
  customSyntax,
  rules: {
    'property-no-vendor-prefix': true,
    'string-no-newline': true,
    'value-no-vendor-prefix': true,
    'no-empty-source': null,
    'no-extra-semicolons': null,
    // /* postcss-linaria */ placeholder comments are added during parsing
    'comment-empty-line-before': [
      'always',
      {
        except: ['first-nested'],
        ignore: ['stylelint-commands'],
        ignoreComments: [/postcss-linaria/],
      },
    ],
    //  '//' comments create unknown word issues while linting. Force using /* */
    'no-invalid-double-slash-comments': true,
  },
};

export default config;
