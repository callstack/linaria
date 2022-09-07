// import { assert } from 'chai';
// import type { Root, Rule, Declaration, Comment } from 'postcss';

// import { createTestAst } from '../../__tests__/util';

// describe('parse', () => {
//   it('should parse basic CSS', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo { color: hotpink; }
//       \`;
//     `);
//     const root = ast.nodes[0] as Root;
//     const rule = root.nodes[0] as Rule;
//     const colour = rule.nodes[0] as Declaration;
//     assert.equal(ast.type, 'document');
//     assert.equal(root.type, 'root');
//     assert.equal(rule.type, 'rule');
//     assert.equal(colour.type, 'decl');
//     assert.equal(root.raws.codeBefore, '\n      css`\n');
//     assert.equal(root.parent, ast);
//     assert.equal(root.raws.codeAfter, '`;\n    ');
//     assert.deepEqual(ast.source!.start, {
//       line: 1,
//       column: 1,
//       offset: 0,
//     });
//     assert.equal(ast.source!.input.css, source);
//   });

//   it('should parse modern JS', () => {
//     const { ast } = createTestAst(`
//       const someObj = {a: {b: 2}};
//       const someValue = someObj?.a?.b ?? 3;
//       css\`
//         .foo { color: hotpink; }
//       \`;
//     `);
//     const root = ast.nodes[0] as Root;
//     const rule = root.nodes[0] as Rule;
//     const colour = rule.nodes[0] as Declaration;
//     assert.equal(ast.type, 'document');
//     assert.equal(root.type, 'root');
//     assert.equal(rule.type, 'rule');
//     assert.equal(colour.type, 'decl');
//   });

//   it('should parse typescript', () => {
//     const { ast } = createTestAst(`
//       function doStuff(x: number, y: number): void {}
//       css\`
//         .foo { color: hotpink; }
//       \`;
//     `);
//     const root = ast.nodes[0] as Root;
//     const rule = root.nodes[0] as Rule;
//     const colour = rule.nodes[0] as Declaration;
//     assert.equal(ast.type, 'document');
//     assert.equal(root.type, 'root');
//     assert.equal(rule.type, 'rule');
//     assert.equal(colour.type, 'decl');
//   });

//   it('should parse multiple stylesheets', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo { color: hotpink; }
//       \`;

//       css\`.bar: { background: lime; }\`;
//     `);
//     assert.equal(ast.nodes.length, 2);
//     const root1 = ast.nodes[0] as Root;
//     const root2 = ast.nodes[1] as Root;

//     assert.equal(root1.type, 'root');
//     assert.equal(root1.raws.codeBefore, '\n      css`\n');
//     assert.equal(root1.raws.codeAfter, undefined);
//     assert.equal(root1.parent, ast);
//     assert.equal(root2.type, 'root');
//     assert.equal(root2.raws.codeBefore, '`;\n\n      css`');
//     assert.equal(root2.raws.codeAfter, '`;\n    ');
//     assert.equal(root2.parent, ast);

//     assert.deepEqual(ast.source!.start, {
//       line: 1,
//       column: 1,
//       offset: 0,
//     });
//     assert.equal(ast.source!.input.css, source);
//   });

//   it('should parse multi-line stylesheets', async () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo {
//           color: hotpink;
//         }
//       \`;
//     `);
//     const root = ast.nodes[0] as Root;
//     const rule = root.nodes[0] as Rule;
//     const colour = rule.nodes[0] as Declaration;
//     assert.equal(ast.type, 'document');
//     assert.equal(root.type, 'root');
//     assert.equal(rule.type, 'rule');
//     assert.equal(colour.type, 'decl');
//     assert.equal(root.raws.codeBefore, '\n      css`\n');
//     assert.equal(root.parent, ast);
//     assert.equal(root.raws.codeAfter, '`;\n    ');
//     assert.deepEqual(ast.source!.start, {
//       line: 1,
//       column: 1,
//       offset: 0,
//     });
//     assert.equal(ast.source!.input.css, source);
//   });

//   it('should parse multi-line stylesheets containing expressions', async () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo {
//           color: hotpink;
//           $\{expr}
//         }
//       \`;
//     `);
//     const root = ast.nodes[0] as Root;
//     const rule = root.nodes[0] as Rule;
//     const colour = rule.nodes[0] as Declaration;
//     assert.equal(ast.type, 'document');
//     assert.equal(root.type, 'root');
//     assert.equal(rule.type, 'rule');
//     assert.equal(colour.type, 'decl');
//     assert.equal(root.raws.codeBefore, '\n      css`\n');
//     assert.equal(root.parent, ast);
//     assert.equal(root.raws.codeAfter, '`;\n    ');
//     assert.deepEqual(ast.source!.start, {
//       line: 1,
//       column: 1,
//       offset: 0,
//     });
//     assert.equal(ast.source!.input.css, source);
//   });

//   it('should parse CSS containing an expression', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .foo { $\{expr}color: hotpink; }
//       \`;
//     `);
//     const root = ast.nodes[0] as Root;
//     const rule = root.nodes[0] as Rule;
//     const placeholder = rule.nodes[0] as Comment;
//     const colour = rule.nodes[1] as Declaration;
//     assert.equal(ast.type, 'document');
//     assert.equal(root.type, 'root');
//     assert.equal(rule.type, 'rule');
//     assert.equal(placeholder.type, 'comment');
//     assert.equal(colour.type, 'decl');
//     assert.equal(ast.source!.input.css, source);
//   });

//   it('should parse JS without any CSS', () => {
//     const { source, ast } = createTestAst(`
//       const foo = 'bar';
//     `);
//     assert.equal(ast.type, 'document');
//     assert.equal(ast.nodes.length, 0);
//     assert.deepEqual(ast.source!.start, {
//       line: 1,
//       column: 1,
//       offset: 0,
//     });
//     assert.equal(ast.source!.input.css, source);
//   });

//   it('should ignore non-css templates', () => {
//     const { source, ast } = createTestAst(`
//       html\`<div></div>\`;
//     `);
//     assert.equal(ast.type, 'document');
//     assert.equal(ast.nodes.length, 0);
//     assert.deepEqual(ast.source!.start, {
//       line: 1,
//       column: 1,
//       offset: 0,
//     });
//     assert.equal(ast.source!.input.css, source);
//   });

//   it('should parse jsx', () => {
//     const { ast } = createTestAst(`
//       import React from 'react';
//       import { css } from 'linaria';
//       import { useCx } from ':linaria';

//       const classNames = {
//         container: css\`
//           color: hotpink;
//           background-color: blue;
//         \`
//       };

//       const HelloWorld = () => {
//         const cx = useCx();
//         return (<div className={cx(classNames.container)}>
//           Hello World
//         </div>);
//       }

//       export default HelloWorld;
//     `);
//     assert.equal(ast.type, 'document');
//     const root = ast.nodes[0] as Root;
//     assert.equal(root.type, 'root');
//     assert.equal(
//       root.source!.input.css,
//       '  color: hotpink;\n  background-color: blue;\n'
//     );
//   });
// });
