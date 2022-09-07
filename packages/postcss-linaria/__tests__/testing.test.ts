import type { Root, Rule, Declaration, Comment } from 'postcss';

import { createTestAst } from './util';
import syntax from '../src/index';

describe('parse', () => {
//   it('should parse basic CSS', () => {
//     const { source, ast } = createTestAst(`
//       const thing = () => { console.log('hello'); }
//       css\`
//         /* stylelint comment */
//         \${expr}
//         .foo {
//           margin: 10px;
//         }
//         .bar {
//           color: black
//         }
//       \`
//       css\`
//         color: pink
//       \`
//     `);
//     // expect(ast.nodes.length).toEqual(1);
//     const root = ast.nodes[0] as Root;
//     console.log(root);
//     const rule = root.nodes[0] as Rule;
//     const colour = rule.nodes[0] as Declaration;
//     expect(ast.type).toEqual('document');
//     expect(root.type).toEqual('root');
//     expect(rule.type).toEqual('rule');
//     expect(colour.type).toEqual('decl');
//     expect(root.raws.codeBefore).toEqual('\n    css`\n');
//     expect(root.parent).toEqual(ast);
//     expect(root.raws.codeAfter).toEqual('`;\n    ');
//     expect(ast.source!.start).toEqual({
//       line: 1,
//       column: 1,
//       offset: 0,
//     });
//     expect(ast.source!.input.css).toEqual(source);
//   });

// it('should parse double expr', () => {
//     const { source, ast } = createTestAst(`
//       const thing = () => { console.log('hello'); }
//       const expr = "padding: 10px";
//       css\`
//        \${expr}
//       \`
//     `);

//     expect(1).toEqual(1);
//   })

//   it('should parse double expr', () => {
//     const { source, ast } = createTestAst(`
//       const thing = () => { console.log('hello'); }
//       css\`
//        \${expr}: something;
//       \`
//     `);

//     expect(1).toEqual(1);
//   })

//   it('should parse double expr', () => {
//     const { source, ast } = createTestAst(`
//       const thing = () => { console.log('hello'); }
//       css\`
//        something: \${expr};
//       \`
//     `);

//     expect(1).toEqual(1);
//   })

//   it('should parse double expr', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//        \${expr1}: \${expr2};
//       \`
//     `);

//     const output = ast.toString(syntax)
//     console.log(output);
//     expect(1).toEqual(1);
//   })

  it('should ignore non-placeholder comments', () => {
    const { source, ast } = createTestAst(`
      css\`
        \${expr0}
        .foo { \${expr1}: \${expr2}; }
        \${expr3} { 
            .bar { color: black}
        }
        \${expr4}
      \`;
    `);

    const output = ast.toString(syntax);
    expect(output).toEqual(source);

    expect(1).toEqual(1);
    // assert.equal(output, source);
  });

// it('should ignore non-placeholder comments', () => {
//     const { source, ast } = createTestAst(`
//         css\`
//         \${expr0}

//         \`;
//     `);

//     const output = ast.toString(syntax);
//     console.log('here9', output);

//     expect(1).toEqual(1);
//     // assert.equal(output, source);
// });

//   it('should ignore non-placeholder comments', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         .\${expr0} { 
//             \${expr1}: \${expr2} 
//         }
//       \`;
//     `);

//     const output = ast.toString(syntax);
//     console.log('here9', output);

//     expect(1).toEqual(1);
//     // assert.equal(output, source);
//   });

//   it('should parse double expr', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         \${layoutVars('--explore_padding-inline')}: 40px;
//         \${expr2} {
//             \${layoutVars('--explore_padding-inline')}: 50px;
//         }
//       \`
//     `);

//     expect(1).toEqual(1);
//   })

//   it('should parse double expr', () => {
//     const { source, ast } = createTestAst(`
//       css\`
//         \${layoutVars('--explore_padding-inline')}: 40px;
//         \${expr2} {
//             margin: 20px;
//             color: black;
//             padding: 10px;
//         }
//       \`
//     `);

//     expect(1).toEqual(1);
//   })
});
