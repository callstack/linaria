// import { assert } from 'chai';
// import type { Root, Rule, Declaration } from 'postcss';

// import syntax = require('../index.js');

// import { createTestAst } from '../../__tests__/util.js';

// describe('stringify', () => {
//   it('should stringify basic CSS', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo { color: hotpink; }
//       \`;
//     `);

//     const output = ast.toString(syntax);

//     assert.equal(output, source);
//   });

//   it('should stringify single-line expressions', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo { $\{expr}color: hotpink; }
//       \`;
//     `);

//     const output = ast.toString(syntax);

//     assert.equal(output, source);
//   });

//   it('should stringify multi-line expressions', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo { $\{
//           expr
//         }color: hotpink; }
//       \`;
//     `);

//     const output = ast.toString(syntax);

//     assert.equal(output, source);
//   });

//   it('should stringify multiple expressions', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo { $\{expr}color: hotpink; }
//         .bar { $\{expr2}color: lime; }
//       \`;
//     `);

//     const output = ast.toString(syntax);

//     assert.equal(output, source);
//   });

//   it('should stringify multiple same-named expressions', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo { $\{expr}color: hotpink; }
//         .bar { $\{expr}color: lime; }
//       \`;
//     `);

//     const output = ast.toString(syntax);

//     assert.equal(output, source);
//   });

//   it('should stringify multiple multi-line expressions', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo { $\{
//           expr }$\{
//           expr2
//         }color: hotpink; }
//       \`;
//     `);

//     const output = ast.toString(syntax);

//     assert.equal(output, source);
//   });

//   it('should stringify multiple stylesheets', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo { color: hotpink; }
//       \`;

//       const somethingInTheMiddle = 808;

//       css\`.foo { color: lime; }\`;
//     `);

//     const output = ast.toString(syntax);

//     assert.equal(output, source);
//   });

//   it('should handle deleted (by another plugin) expression state', () => {
//     const { ast } = createTestAst(`
//       css\`
//         .foo { $\{expr}color: hotpink; }
//       \`;
//     `);

//     const root = ast.nodes[0]!;
//     root.raws.linariaTemplateExpressions = undefined;
//     const output = ast.toString(syntax);

//     assert.equal(
//       output,
//       `
//       css\`
//         .foo { /*linaria:0*/color: hotpink; }
//       \`;
//     `
//     );
//   });

//   it('should ignore non-placeholder comments', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo { /*BOOP*/color: hotpink; }
//       \`;
//     `);

//     const output = ast.toString(syntax);

//     assert.equal(output, source);
//   });

//   it('should handle deleted individual expression state', () => {
//     const { ast } = createTestAst(`
//       css\`
//         .foo { $\{expr}color: hotpink; }
//       \`;
//     `);

//     const root = ast.nodes[0]!;
//     root.raws.linariaTemplateExpressions = [];
//     const output = ast.toString(syntax);

//     assert.equal(
//       output,
//       `
//       css\`
//         .foo { /*linaria:0*/color: hotpink; }
//       \`;
//     `
//     );
//   });

//   it('should handle base indentations', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo {
//           color: hotpink;
//         }

//         .bar {
//           border: 808em solid cyan;
//         }
//       \`;
//     `);

//     const output = ast.toString(syntax);

//     assert.equal(output, source);
//   });

//   it('should deal with multi-line rules', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo,
//           .bar {
//             color: hotpink;
//         }

//         .x,
//         .x > .y {
//   font-size: 32em;
//         }
//       \`;
//     `);

//     const output = ast.toString(syntax);

//     assert.equal(output, source);
//   });

//   it('should deal with multi-line declarations', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo {
//           margin:
//             1px
//             2px
//             3px
//             4px;
//         }

//         .bar {
//           margin: 1px
//             2px
//             3px;
//         }
//       \`;
//     `);

//     const output = ast.toString(syntax);

//     assert.equal(output, source);
//   });

//   it('should deal with unusual between values', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo {
//           margin
//             :
//               10px;
//         }
//       \`;
//     `);

//     const output = ast.toString(syntax);

//     assert.equal(output, source);
//   });

//   it('should deal with unusual before values', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo {
//           margin: 10px;

//           ;

//           margin: 20px;
//         }
//       \`;
//     `);

//     const output = ast.toString(syntax);

//     assert.equal(output, source);
//   });

//   it('should deal with unusual after values', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo {
//           margin:
//             1px
//             2px;

//           ;

//         }
//       \`;
//     `);

//     const output = ast.toString(syntax);

//     assert.equal(output, source);
//   });

//   it('should stringify non-css JS', () => {
//     const { source, ast } = createTestAst(`
//       const a = 5;
//       const b = 303;
//     `);

//     const output = ast.toString(syntax);

//     assert.equal(output, source);
//   });

//   it('should stringify empty CSS', () => {
//     const { source, ast } = createTestAst(`
//       css\`\`;
//     `);

//     const output = ast.toString(syntax);

//     assert.equal(output, source);
//   });

//   it('should stringify single-line CSS', () => {
//     const { source, ast } = createTestAst(`
//       css\`.foo { color: hotpink; }\`;
//     `);

//     const output = ast.toString(syntax);

//     assert.equal(output, source);
//   });

//   it('should escape backticks', () => {
//     const { ast } = createTestAst(`
//       css\`.foo { color: hotpink; }\`;
//     `);

//     const root = ast.nodes[0] as Root;
//     const rule = root.nodes[0] as Rule;
//     const colour = rule.nodes[0] as Declaration;

//     colour.raws.between = ': /*comment with `backticks`*/';

//     const output = ast.toString(syntax);
//     assert.equal(
//       output,
//       `
//       css\`.foo { color: /*comment with \\\`backticks\\\`*/hotpink; }\`;
//     `
//     );
//   });

//   it('should not escape unrelated backticks', () => {
//     const { ast } = createTestAst(`
//       html\`<div></div>\`;
//     `);
//     const output = ast.toString(syntax);

//     assert.equal(
//       output,
//       `
//       html\`<div></div>\`;
//     `
//     );
//   });

//   it('should not escape unrelated backslashes', () => {
//     const { ast } = createTestAst(`
//       const foo = 'abc\\def';
//     `);
//     const output = ast.toString(syntax);

//     assert.equal(
//       output,
//       `
//       const foo = 'abc\\def';
//     `
//     );
//   });

//   it('should escape backslashes', () => {
//     const { ast } = createTestAst(`
//       css\`.foo { color: hotpink; }\`;
//     `);

//     const root = ast.nodes[0] as Root;
//     const rule = root.nodes[0] as Rule;

//     rule.selector = '.foo\\:bar';

//     const output = ast.toString(syntax);
//     assert.equal(
//       output,
//       `
//       css\`.foo\\\\:bar { color: hotpink; }\`;
//     `
//     );
//   });
// });
