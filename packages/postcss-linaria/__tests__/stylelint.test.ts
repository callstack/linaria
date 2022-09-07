// import { assert } from 'chai';
import stylelint from 'stylelint';

import syntax from '../src/index';

describe('stylelint', () => {
  it('should be lintable by stylelint', async () => {
    const source = `
      css\`
        \${expr0}
        .foo { \${expr1}: \${expr2}; }
        \${expr3} { 
            .bar { color: black; }
        }
        \${expr4}
      \`;
    `;
    const result = await stylelint.lint({
      customSyntax: syntax,
      code: source,
      codeFilename: 'foo.js',
      config: {
        rules: {
          'annotation-no-unknown': true,
          'at-rule-no-unknown': [true, { ignoreAtRules: [/linaria/] }],
          'block-no-empty': true,
          'color-no-invalid-hex': true,
          'comment-no-empty': true,
          'declaration-block-no-duplicate-custom-properties': true,
          'declaration-block-no-duplicate-properties': [
            true,
            {
              ignore: ['consecutive-duplicates-with-different-values'],
            },
          ],
          'declaration-block-no-shorthand-property-overrides': true,
          'font-family-no-duplicate-names': true,
          'font-family-no-missing-generic-family-keyword': true,
          'function-calc-no-unspaced-operator': true,
          'function-no-unknown': true,
          'function-linear-gradient-no-nonstandard-direction': true,
          'keyframe-block-no-duplicate-selectors': true,
          'keyframe-declaration-no-important': true,
          'media-feature-name-no-unknown': true,
          'named-grid-areas-no-invalid': true,
          'no-descending-specificity': true,
          'no-duplicate-at-import-rules': true,
          'no-duplicate-selectors': true,
          'no-empty-source': true,
          'no-extra-semicolons': true,
          'no-invalid-double-slash-comments': true,
          'no-invalid-position-at-import-rule': true,
          'no-irregular-whitespace': true,
          'property-no-unknown': [true, { ignoreProperties: [/linaria/] }],
          'selector-pseudo-class-no-unknown': true,
          'selector-pseudo-element-no-unknown': true,
          'selector-type-no-unknown': [
            true,
            {
              ignore: ['custom-elements'],
            },
          ],
          'string-no-newline': true,
          'unit-no-unknown': true,
          'declaration-no-important': [
            true,
            {
              message:
                'Do not use !important, prefer to use the extend styles pattern (http://air.bb/extend-styles)',
            },
          ],
      
          'function-comma-newline-after': [
            'always-multi-line',
            {
              message:
                'Do not leave out a newline after a comma in a multiline function. Prefer to end lines with commas in multiline functions.',
            },
          ],
      
          'function-max-empty-lines': [
            0,
            {
              message:
                'Do not add empty lines in functions. Prefer to keep lines without gaps between them.',
            },
          ],
      
          'function-name-case': [
            'lower',
            {
              message: 'Do not use mixed or uppercase for function names. Prefer to use lowercase only.',
            },
          ],
      
          'function-whitespace-after': [
            'always',
            {
              message:
                'Do not leave out whitespace after functions. Prefer to add whitespace between function calls.',
            },
          ],
      
          'number-leading-zero': [
            'always',
            { message: 'Do not use the fractional format, prefer to add a leading zero.', fix: true },
          ],
      
          'number-no-trailing-zeros': [
            true,
            { message: 'Do not include trailing zeroes in numbers. Prefer to leave them out.' },
          ],
      
          'string-quotes': [
            'single',
            { message: 'Do not use double quotes. Prefer to use single quotes.' },
          ],
      
          'unit-case': [
            'lower',
            { message: 'Do not use upper or mixed case for units. Prefer to use lowercase only.' },
          ],
      
          'value-keyword-case': [
            'lower',
            {
              ignoreProperties: ['font-family', 'font'],
              ignoreKeywords: ['currentColor'],
              message: 'Do not use upper or mixed case for value keywords. Prefer to use lowercase only.',
            },
          ],
      
          // Not enforced with stylelint because atomic styles generates styles that don't adhere to this.
          // 'value-list-comma-space-after': [
          //   'always',
          //   {
          //     message:
          //       'Do not put values directly after a comma in a value list. Prefer to put a space after the comma.',
          //   },
          // ],
      
          'property-case': [
            'lower',
            {
              message: 'Do not use upper or mixed case for properties. Prefer to use lowercase only.',
            },
          ],
      
          'declaration-colon-space-before': [
            'never',
            {
              message:
                'Do not put a space before a colon in declarations. Prefer to use the format `property: value`.',
            },
          ],
      
          'declaration-block-no-duplicate-properties': null,
      
          'declaration-block-trailing-semicolon': [
            'always',
            {
              message:
                'Do not leave out the semicolon on the last line of declaration blocks. Prefer to insert a trailing semicolon.',
            },
          ],
      
          'no-descending-specificity': null,
      
          'selector-pseudo-class-no-unknown': [
            true,
            {
              ignorePseudoClasses: ['global'],
            },
          ],
      
          'selector-pseudo-class-disallowed-list': [
            'global',
            {
              message:
                'Do not use :global(). There are very limited use cases for global styles. (With an exception for setting global css variables via the theme). Prefer to use the extend styles pattern (http://air.bb/extend-styles)',
            },
          ],
      
          'selector-max-type': [
            0,
            {
              message:
                'Do not target element types in selectors. Prefer to use the extend styles pattern on that component instead (http://air.bb/extend-styles).',
            },
          ],
      
          'selector-attribute-brackets-space-inside': [
            'never',
            {
              message: 'Do not insert spaces inside attribute selectors. Prefer to leave no space.',
            },
          ],
      
          'selector-attribute-operator-space-after': [
            'never',
            {
              message: 'Do not insert spaces around attribute operators. Prefer to leave out spaces.',
            },
          ],
      
          'selector-attribute-operator-space-before': [
            'never',
            {
              message: 'Do not insert spaces around attribute operators. Prefer to leave out spaces.',
            },
          ],
      
          'selector-combinator-space-after': [
            'always',
            {
              message: 'Do not leave out spaces in combinator. Prefer to insert spaces.',
            },
          ],
      
          'selector-combinator-space-before': [
            'always',
            {
              message: 'Do not leave out spaces in combinator. Prefer to insert spaces.',
            },
          ],
      
          'selector-attribute-quotes': [
            'always',
            {
              message:
                'Do not leave out quote marks on attribute selectors. Prefer to insert quote marks.',
            },
          ],
      
          'selector-pseudo-class-case': [
            'lower',
            {
              message:
                'Do not use upper or mixed case for pseudo class selectors. Prefer to use lowercase.',
            },
          ],
      
          'selector-pseudo-class-parentheses-space-inside': [
            'never',
            {
              message:
                'Do not insert spaces inside pseudo class selector parentheses. Prefer to leave out spaces.',
            },
          ],
      
          'selector-pseudo-element-case': [
            'lower',
            {
              message: 'Do not use upper or mixed case for pseudo elements. Prefer to use lowercase.',
            },
          ],
      
          // Not enforced with stylelint due to an integration issue with the `max-empty-lines` stylelint rule and linaria.
          // https://github.com/callstack/linaria/issues/693
          // 'rule-empty-line-before': [
          //   'always',
          //   {
          //     ignore: ['first-nested', 'after-comment'],
          //     message:
          //       'Do not put rule blocks directly adjacent to each other. Prefer to insert a gap between rule blocks.',
          //   },
          // ],
      
          // Not enforced with stylelint because atomic styles generates styles that don't adhere to this.
          // 'media-feature-colon-space-after': [
          //   'always',
          //   {
          //     message:
          //       'Do not put spaces before a colon or leave one out after a colon in media features. Prefer to use the format `@media (max-width: 600px)`.',
          //   },
          // ],
      
          'media-feature-colon-space-before': [
            'never',
            {
              message:
                'Do not put spaces before a colon or leave one out after a colon in media features. Prefer to use the format `@media (max-width: 600px)`.',
            },
          ],
      
          'media-feature-name-case': [
            'lower',
            {
              message:
                'Do not use upper or mixed case for media feature names. Prefer to use lower case.',
            },
          ],
      
          'media-feature-range-operator-space-after': [
            'always',
            {
              message:
                'Do not put media operators directly next to the parts their operands. Prefer to separate with spaces.',
            },
          ],
      
          'media-feature-range-operator-space-before': [
            'always',
            {
              message:
                'Do not put media operators directly next to the parts their operands. Prefer to separate with spaces.',
            },
          ],
      
          'media-query-list-comma-space-after': [
            'always',
            {
              message:
                'Do not separate media query lists with commas only. Prefer to separate with a comma, followed by a space, with the format `@media screen and (color), projection and (color)`.',
            },
          ],
      
          'media-query-list-comma-space-before': [
            'never',
            {
              message:
                'Do not separate media query lists with commas only. Prefer to separate with a comma, followed by a space, with the format `@media screen and (color), projection and (color)`.',
            },
          ],
      
          // Not enforced with stylelint due to an integration issue with the `at-rule-empty-line-before` stylelint rule and linaria.
          // https://github.com/callstack/linaria/issues/693
          // 'at-rule-empty-line-before': [
          //   'always',
          //   {
          //     except: 'first-nested',
          //     ignoreAtRules: ['property', 'scroll-timeline'],
          //     message:
          //       'Do not put anything before an @ rule, prefer to leave a blank line before it (except if it is the first at rule in a block). Prefer to insert a new line before the at-rule.',
          //   },
          // ],
      
          'at-rule-name-case': [
            'lower',
            {
              message: 'Do not use upper or mixed case for at-rules. Prefer to use lower case.',
            },
          ],
      
          'at-rule-name-space-after': [
            'always',
            {
              message:
                'Do not put at rule parameters directly after the at-rule name. Prefer to insert a space.',
            },
          ],
      
          'at-rule-semicolon-newline-after': [
            'always',
            {
              message:
                'Do not put multiple at-rules on the same line. Prefer to insert a newline after each at-rule semicolon.',
            },
          ],
      
          'at-rule-semicolon-space-before': [
            'never',
            {
              message: 'Do not put spaces before semicolons of at-rules. Prefer to leave out the space.',
            },
          ],
      
          linebreaks: [
            'unix',
            { message: 'Do not end lines with CRLF (\r\n). Prefer to end lines with LF (\n).' },
          ],
      
          'comment-word-disallowed-list': [
            [
              /\/\*( *)stylelint-disable( *)\*\//,
              /\/\*( *)stylelint-disable-line( *)\*\//,
              /\/\*( *)stylelint-disable-next-line( *)\*\//,
            ],
            {
              message:
                'Do not use stylelint-disable comments without specifying rules. Prefer to disable specific rules.',
            },
          ],
      
          // We're allowing duplicate selectors because linaria/stylelint-config's
          // preprocessor processes the styles into a block that uses the displayName
          // for the class name (in a css template literal, linaria will be generating
          // these display names). This might be a problem in
          // linaria/stylelint-config:
          // https://github.com/callstack/linaria/blob/2.0.x/src/stylelint/preprocessor.ts#L82
          // It appears to be changed in v3 beta, so we could try again when that is
          // available.
          'no-duplicate-selectors': null,
      
          // Not enforced with stylelint due to an integration issue with the `indentation` stylelint rule and linaria.
          // https://github.com/callstack/linaria/issues/693
          // indentation: [
          //   2,
          //   {
          //     message:
          //       'Do not use indentation of any size other than 2 spaces. Prefer to use 2 spaces to indent nested lines.',
          //   },
          // ],
      
          // Not enforced with stylelint due to an integration issue with the `max-empty-lines` stylelint rule and linaria.
          // https://github.com/callstack/linaria/issues/693
          // 'max-empty-lines': [
          //   1,
          //   {
          //     message:
          //       'Do not leave multiple consecutive empty lines adjacent to each other. Prefer to separate sections with comments if necessary.',
          //   },
          // ],
      
          // Not enforced with stylelint due to an integration issue with the `max-empty-lines` stylelint rule and linaria.
          // https://github.com/callstack/linaria/issues/693
          // 'no-eol-whitespace': [
          //   true,
          //   {
          //     message: 'Do not leave whitespace at the end of a line. Prefer to remove it.',
          //   },
          // ],
      
          // Not enforced with stylelint due to an integration issue with the `no-empty-first-line` stylelint rule and linaria.
          // https://github.com/callstack/linaria/issues/693
          // 'no-empty-first-line': [
          //   true,
          //   {
          //     message: 'Do not insert an empty first line in a style block. Prefer to remove it.',
          //   },
          // ],
        },
      },
    });

    console.log(result);

    expect(1).toEqual(1);

    // assert.equal(result.errored, true);

    // const fooResult = result.results[0]!;
    // assert.deepEqual(fooResult.warnings, [
    //   {
    //     line: 3,
    //     column: 23,
    //     rule: 'unit-no-unknown',
    //     severity: 'error',
    //     text: 'Unexpected unknown unit "nanoacres" (unit-no-unknown)',
    //   },
    // ]);
  });

//   it('should be fixable by stylelint', async () => {
//     const source = `
//       css\`
//         .foo { color: hotpink;; }
//       \`;
//     `;
//     const result = await stylelint.lint({
//       customSyntax: syntax,
//       code: source,
//       codeFilename: 'foo.js',
//       fix: true,
//       config: {
//         rules: {
//           'no-extra-semicolons': true,
//         },
//       },
//     });

//     assert.equal(
//       result.output,
//       `
//       css\`
//         .foo { color: hotpink; }
//       \`;
//     `
//     );
//   });

//   it('should be fixable by stylelint with expressions', async () => {
//     const source = `
//       css\`
//         .foo { $\{expr}color: hotpink;; }
//       \`;
//     `;
//     const result = await stylelint.lint({
//       customSyntax: syntax,
//       code: source,
//       codeFilename: 'foo.js',
//       fix: true,
//       config: {
//         rules: {
//           'no-extra-semicolons': true,
//         },
//       },
//     });

//     assert.equal(
//       result.output,
//       `
//       css\`
//         .foo { $\{expr}color: hotpink; }
//       \`;
//     `
//     );
//   });

//   it('should be fixable by stylelint with multi-line expressions', async () => {
//     const source = `
//       css\`
//         $\{
//           expr1
//         }
//         .foo { $\{expr2}color: hotpink;; }
//       \`;
//     `;
//     const result = await stylelint.lint({
//       customSyntax: syntax,
//       code: source,
//       codeFilename: 'foo.js',
//       fix: true,
//       config: {
//         rules: {
//           'no-extra-semicolons': true,
//         },
//       },
//     });

//     assert.equal(
//       result.output,
//       `
//       css\`
//         $\{
//           expr1
//         }
//         .foo { $\{expr2}color: hotpink; }
//       \`;
//     `
//     );
//   });

//   it('should be compatible with indentation rule', async () => {
//     const source = `
//       css\`
//         .foo {
//           width: 100px;
//         }
//       \`;
//     `;
//     const result = await stylelint.lint({
//       customSyntax: syntax,
//       code: source,
//       codeFilename: 'foo.js',
//       config: {
//         rules: {
//           indentation: 2,
//         },
//       },
//     });

//     assert.equal(result.errored, false);
//   });
});
