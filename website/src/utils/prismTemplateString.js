/**
 * Adapted from: https://github.com/styled-components/styled-components-website/blob/656442b5fd565c9a866f414bb87e0eb729426b93/utils/prismTemplateString.js
 */

if (window.Prism) {
  // NOTE: This highlights template-strings as strings of CSS
  window.Prism.languages.insertBefore('jsx', 'template-string', {
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
            rest: window.Prism.languages.jsx,
          },
        },
        string: {
          pattern: /[\s\S]+/,
          inside: window.Prism.languages.css,
          alias: 'language-css',
        },
      },
    },
  });
}
