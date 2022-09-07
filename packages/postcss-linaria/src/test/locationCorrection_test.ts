// import { assert } from 'chai';
// import type { Root, Rule, Declaration } from 'postcss';

// import {
//   createTestAst,
//   getSourceForNodeByRange,
//   getSourceForNodeByLoc,
// } from '../../__tests__/util.js';

// describe('locationCorrection', () => {
//   it('should translate basic CSS positions', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo { color: hotpink; }
//       \`;
//     `);
//     const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
//     const colour = rule.nodes[0] as Declaration;
//     assert.equal(colour.type, 'decl');
//     assert.equal(rule.type, 'rule');
//     assert.equal(
//       getSourceForNodeByLoc(source, rule),
//       '.foo { color: hotpink; }'
//     );
//     assert.equal(getSourceForNodeByLoc(source, colour), 'color: hotpink;');
//     assert.equal(
//       getSourceForNodeByRange(source, rule),
//       '.foo { color: hotpink; }'
//     );
//     assert.equal(getSourceForNodeByRange(source, colour), 'color: hotpink;');
//   });

//   it('should handle multi-line CSS', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo {
//           color: hotpink;
//         }
//       \`;
//     `);
//     const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
//     const colour = rule.nodes[0] as Declaration;
//     assert.equal(colour.type, 'decl');
//     assert.equal(rule.type, 'rule');
//     assert.equal(
//       getSourceForNodeByLoc(source, rule),
//       `.foo {
//           color: hotpink;
//         }`
//     );
//     assert.equal(getSourceForNodeByLoc(source, colour), 'color: hotpink;');
//     assert.equal(
//       getSourceForNodeByRange(source, rule),
//       `.foo {
//           color: hotpink;
//         }`
//     );
//     assert.equal(getSourceForNodeByRange(source, colour), 'color: hotpink;');
//   });

//   it('should handle multi-line CSS with expressions', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo {
//           color: hotpink;
//           $\{expr}
//         }
//       \`;
//     `);
//     const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
//     const colour = rule.nodes[0] as Declaration;
//     assert.equal(colour.type, 'decl');
//     assert.equal(rule.type, 'rule');
//     assert.equal(
//       getSourceForNodeByLoc(source, rule),
//       `.foo {
//           color: hotpink;
//           $\{expr}
//         }`
//     );
//     assert.equal(getSourceForNodeByLoc(source, colour), 'color: hotpink;');
//     assert.equal(
//       getSourceForNodeByRange(source, rule),
//       `.foo {
//           color: hotpink;
//           $\{expr}
//         }`
//     );
//     assert.equal(getSourceForNodeByRange(source, colour), 'color: hotpink;');
//   });

//   it('should handle single line expressions', () => {
//     const { source, ast } = createTestAst(`css\`.foo { color: hotpink; }\`;`);
//     const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
//     const colour = rule.nodes[0] as Declaration;
//     assert.equal(colour.type, 'decl');
//     assert.equal(rule.type, 'rule');
//     assert.equal(
//       getSourceForNodeByLoc(source, rule),
//       '.foo { color: hotpink; }'
//     );
//     assert.equal(getSourceForNodeByLoc(source, colour), 'color: hotpink;');
//     assert.equal(
//       getSourceForNodeByRange(source, rule),
//       '.foo { color: hotpink; }'
//     );
//     assert.equal(getSourceForNodeByRange(source, colour), 'color: hotpink;');
//   });

//   it('should account for single-line expressions', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo { $\{expr\}color: hotpink; }
//       \`;
//     `);
//     const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
//     const colour = rule.nodes[1] as Declaration;
//     assert.equal(colour.type, 'decl');
//     assert.equal(rule.type, 'rule');
//     assert.equal(
//       getSourceForNodeByLoc(source, rule),
//       '.foo { ${expr}color: hotpink; }'
//     );
//     assert.equal(getSourceForNodeByLoc(source, colour), 'color: hotpink;');
//     assert.equal(
//       getSourceForNodeByRange(source, rule),
//       '.foo { ${expr}color: hotpink; }'
//     );
//     assert.equal(getSourceForNodeByRange(source, colour), 'color: hotpink;');
//   });

//   it('should account for multiple single-line expressions', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo { $\{expr\}color: $\{expr2\}hotpink; }
//       \`;
//     `);
//     const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
//     const colour = rule.nodes[1] as Declaration;
//     assert.equal(colour.type, 'decl');
//     assert.equal(rule.type, 'rule');
//     assert.equal(
//       getSourceForNodeByLoc(source, rule),
//       '.foo { ${expr}color: ${expr2}hotpink; }'
//     );
//     assert.equal(
//       getSourceForNodeByLoc(source, colour),
//       'color: ${expr2}hotpink;'
//     );
//     assert.equal(
//       getSourceForNodeByRange(source, rule),
//       '.foo { ${expr}color: ${expr2}hotpink; }'
//     );
//     assert.equal(
//       getSourceForNodeByRange(source, colour),
//       'color: ${expr2}hotpink;'
//     );
//   });

//   it('should account for multi-line expressions', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo { $\{
//           expr
//         \}color: hotpink; }
//       \`;
//     `);
//     const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
//     const colour = rule.nodes[1] as Declaration;
//     assert.equal(colour.type, 'decl');
//     assert.equal(rule.type, 'rule');
//     assert.equal(
//       getSourceForNodeByLoc(source, rule),
//       `.foo { $\{
//           expr
//         }color: hotpink; }`
//     );
//     assert.equal(getSourceForNodeByLoc(source, colour), 'color: hotpink;');
//     assert.equal(
//       getSourceForNodeByRange(source, rule),
//       `.foo { $\{
//           expr
//         }color: hotpink; }`
//     );
//     assert.equal(getSourceForNodeByRange(source, colour), 'color: hotpink;');
//   });

//   it('should account for multiple mixed-size expressions', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo { $\{
//           expr
//         \} $\{expr2\}color: hotpink; }
//       \`;
//     `);
//     const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
//     const colour = rule.nodes[2] as Declaration;
//     assert.equal(colour.type, 'decl');
//     assert.equal(rule.type, 'rule');
//     assert.equal(
//       getSourceForNodeByLoc(source, rule),
//       `.foo { $\{
//           expr
//         } $\{expr2}color: hotpink; }`
//     );
//     assert.equal(getSourceForNodeByLoc(source, colour), 'color: hotpink;');
//     assert.equal(
//       getSourceForNodeByRange(source, rule),
//       `.foo { $\{
//           expr
//         } $\{expr2}color: hotpink; }`
//     );
//     assert.equal(getSourceForNodeByRange(source, colour), 'color: hotpink;');
//   });

//   it('should account for code before', () => {
//     const { source, ast } = createTestAst(`
//       const foo = bar + baz;
//       css\`
//         .foo { color: hotpink; }
//       \`;
//     `);
//     const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
//     const colour = rule.nodes[0] as Declaration;
//     assert.equal(colour.type, 'decl');
//     assert.equal(rule.type, 'rule');
//     assert.equal(
//       getSourceForNodeByLoc(source, rule),
//       '.foo { color: hotpink; }'
//     );
//     assert.equal(getSourceForNodeByLoc(source, colour), 'color: hotpink;');
//     assert.equal(
//       getSourceForNodeByRange(source, rule),
//       '.foo { color: hotpink; }'
//     );
//     assert.equal(getSourceForNodeByRange(source, colour), 'color: hotpink;');
//   });

//   it('should account for mixed indentation', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//   .foo { $\{expr\}color: hotpink; }
//       \`;
//     `);
//     const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
//     const colour = rule.nodes[1] as Declaration;
//     assert.equal(colour.type, 'decl');
//     assert.equal(rule.type, 'rule');
//     assert.equal(
//       getSourceForNodeByLoc(source, rule),
//       '.foo { ${expr}color: hotpink; }'
//     );
//     assert.equal(getSourceForNodeByLoc(source, colour), 'color: hotpink;');
//     assert.equal(
//       getSourceForNodeByRange(source, rule),
//       '.foo { ${expr}color: hotpink; }'
//     );
//     assert.equal(getSourceForNodeByRange(source, colour), 'color: hotpink;');
//   });
// });
