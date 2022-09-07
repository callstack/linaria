// import { assert } from 'chai';
// import stylelint = require('stylelint');

// import syntax = require('../index.js');

// describe('stylelint', () => {
//   it('should be lintable by stylelint', async () => {
//     const source = `
//       css\`
//         .foo { width: 100nanoacres; }
//       \`;
//     `;
//     const result = await stylelint.lint({
//       customSyntax: syntax,
//       code: source,
//       codeFilename: 'foo.js',
//       config: {
//         rules: {
//           'unit-no-unknown': true,
//         },
//       },
//     });

//     assert.equal(result.errored, true);

//     const fooResult = result.results[0]!;
//     assert.deepEqual(fooResult.warnings, [
//       {
//         line: 3,
//         column: 23,
//         rule: 'unit-no-unknown',
//         severity: 'error',
//         text: 'Unexpected unknown unit "nanoacres" (unit-no-unknown)',
//       },
//     ]);
//   });

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
// });
