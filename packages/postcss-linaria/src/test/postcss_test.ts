// import { assert } from 'chai';
// import type {
//   Rule,
//   Declaration,
//   Document,
//   Root,
//   TransformCallback,
// } from 'postcss';
// import postcss from 'postcss';

// import syntax from '../index';

// describe('postcss', () => {
//   it('should parse basic CSS', async () => {
//     const source = `
//       css\`
//         .foo { color: hotpink; }
//       \`;
//     `;
//     const result = await postcss().process(source, { syntax, from: 'foo.js' });
//     const ast = result.root as unknown as Document;
//     const root = ast.nodes[0]!;
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

//   it('should work with other plugins', async () => {
//     const source = `
//       css\`
//         .foo { color: hotpink; }
//       \`;
//     `;
//     const transform: TransformCallback = (root: Root): void => {
//       root.walk((node) => {
//         if (node.type === 'decl' && node.value === 'hotpink') {
//           node.value = 'lime';
//         }
//       });
//     };
//     const result = await postcss([transform]).process(source, {
//       syntax,
//       from: 'foo.js',
//     });
//     const output = result.toString();
//     assert.equal(
//       output,
//       `
//       css\`
//         .foo { color: lime; }
//       \`;
//     `
//     );
//   });
// });
