/* @flow */

const babel = require('@babel/core');

/* ::
type LintResult = {
  warnings: { line: number, column: number }[],
};
*/

function preprocessor() {
  return {
    code(input /* : string */, filename /* : string */) {
      // Check if the file contains `css` or `styled` tag first
      // Otherwise we should skip linting
      if (!/\b(styled(\([^)]+\)|\.[a-z0-9]+)|css)`/.test(input)) {
        return '';
      }

      const { metadata } = babel.transformSync(input, {
        filename,
      });

      if (!metadata.linaria) {
        return '';
      }

      let cssText = '';

      // Construct a CSS-ish file from the unprocessed style rules
      const { rules } = metadata.linaria;

      Object.keys(rules).forEach(className => {
        const rule = rules[className];

        // Append new lines until we get to the start line number
        let line = cssText.split('\n').length;

        while (line < rule.start.line) {
          cssText += '\n';
          line++;
        }

        cssText += `.${rule.displayName} {`;

        // Append blank spaces until we get to the start column number
        const last = cssText.split('\n').pop();

        let column = last ? last.length : 0;

        while (column < rule.start.column) {
          cssText += ' ';
          column++;
        }

        cssText += `${rule.cssText} }`;
      });

      return cssText;
    },
    result(result /* : LintResult */) {
      return result;
    },
  };
}

module.exports = preprocessor;
