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
    'at-rule-no-unknown': [true, { ignoreAtRules: [/linaria/] }],
    'property-no-unknown': [true, { ignoreProperties: [/linaria/] }],
    'comment-empty-line-before': [
      'always',
      {
        except: ['first-nested'],
        ignore: ['stylelint-commands'],
        ignoreComments: [/linaria/],
      },
    ],
  },
};

export default config;
