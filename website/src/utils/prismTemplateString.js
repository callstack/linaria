/**
 * Adapted from: https://github.com/styled-components/styled-components-website/blob/656442b5fd565c9a866f414bb87e0eb729426b93/utils/prismTemplateString.js
 */

const Prism = global.Prism;

if (Prism) {
  // NOTE: This highlights template-strings as strings of CSS
  Prism.languages.insertBefore('jsx', 'template-string', {
    'styled-template-string': {
      pattern: /((\.\w+|\([^)]*\))(\.\w+(\([^)]*\))*)*|css|keyframes|\.extend)`(?:\$\{[^}]+\}|\\\\|\\?[^\\])*?`/,
      lookbehind: true,
      greedy: true,
      inside: {
        interpolation: {
          pattern: /\$\{[^}]+\}/,
          inside: {
            'interpolation-punctuation': {
              pattern: /^\$\{|\}$/,
              alias: 'punctuation',
            },
            rest: Prism.languages.jsx,
          },
        },
        string: {
          pattern: /[\s\S]+/,
          inside: Prism.languages.css,
          alias: 'language-css',
        },
      },
    },
  });
}
