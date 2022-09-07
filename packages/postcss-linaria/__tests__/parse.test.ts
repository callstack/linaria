import type { Root, Rule, Declaration, Comment } from 'postcss';

import { createTestAst } from './util';

describe('parse', () => {
  describe('expressions', () => {
    it('should parse a ruleset expression', () => {
      const { source, ast } = createTestAst(`
        const expr = 'color: black';
        css\`
          $\{expr}
        \`;
      `);
      expect(ast.nodes.length).toEqual(1);
      const root = ast.nodes[0] as Root;
      expect(root.source?.input.css).toEqual('  /*linaria:0*/\n');
    });

    it('should parse a selector or at-rule expression', () => {
      const { source, ast } = createTestAst(`
        const expr = '@media (min-width: 100px)';
        css\`
          $\{expr} {
            color: black;
          }
        \`;
      `);
      expect(ast.nodes.length).toEqual(1);
      const root = ast.nodes[0] as Root;
      expect(root.source?.input.css).toEqual(`  @linaria0 {\n    color: black;\n  }\n`);
    });
    it('should parse a declaration property expression', () => {});
    it('should parse a declaration value with a single expression', () => {});
    it('should parse a declaration value with multiple expressions', () => {});
    it('should parse a combinations of all expressions', () => {});
  });

  describe('languages', () => {
    it('should parse css', () => {
      const { source, ast } = createTestAst(`
      css\`
        .foo { color: hotpink; }
      \`;
      `);
      expect(ast.nodes.length).toEqual(1);
      const root = ast.nodes[0] as Root;
      const rule = root.nodes[0] as Rule;
      const colour = rule.nodes[0] as Declaration;
      expect(ast.type).toEqual('document');
      expect(root.type).toEqual('root');
      expect(rule.type).toEqual('rule');
      expect(colour.type).toEqual('decl');
      expect(root.raws.codeBefore).toEqual('\n      css`\n');
      expect(root.parent).toEqual(ast);
      expect(root.raws.codeAfter).toEqual('`;\n      ');
      expect(ast.source!.start).toEqual({
        line: 1,
        column: 1,
        offset: 0,
      });
      expect(ast.source!.input.css).toEqual(source);
    });

    it('should parse javascript', () => {
      const { ast } = createTestAst(`
        const someObj = {a: {b: 2}};
        const someValue = someObj?.a?.b ?? 3;
        css\`
          .foo { color: hotpink; }
        \`;
      `);
      expect(ast.nodes.length).toEqual(1);
      const root = ast.nodes[0] as Root;
      const rule = root.nodes[0] as Rule;
      const color = rule.nodes[0] as Declaration;
      expect(ast.type).toEqual('document');
      expect(root.type).toEqual('root');
      expect(rule.type).toEqual('rule');
      expect(color.type).toEqual('decl');
    });

    it('should parse javascript without any CSS', () => {
      const { source, ast } = createTestAst(`
        const foo = 'bar';
      `);
      expect(ast.type).toEqual('document');
      expect(ast.nodes.length).toEqual(0);
      expect(ast.source!.start).toEqual({
        line: 1,
        column: 1,
        offset: 0,
      });
      expect(ast.source!.input.css).toEqual(source);
    });

    it('should parse typescript', () => {
      const { ast } = createTestAst(`
        function doStuff(x: number, y: number): void {}
        css\`
          .foo { color: hotpink; }
        \`;
      `);
      expect(ast.nodes.length).toEqual(1);
      const root = ast.nodes[0] as Root;
      const rule = root.nodes[0] as Rule;
      const color = rule.nodes[0] as Declaration;
      expect(ast.type).toEqual('document');
      expect(root.type).toEqual('root');
      expect(rule.type).toEqual('rule');
      expect(color.type).toEqual('decl');
    });

    it('should parse jsx', () => {
      const { ast } = createTestAst(`
        import React from 'react';
        import { css } from 'linaria';

        const container = css\`
          color: hotpink;
        \`

        const HelloWorld = () => {
          const cx = useCx();
          return (<div className={container}>
            Hello World
          </div>);
        }

        export default HelloWorld;
      `);
      expect(ast.type).toEqual('document');
      const root = ast.nodes[0] as Root;
      expect(root.type).toEqual('root');
      expect(root.source!.input.css).toEqual('  color: hotpink;\n');
    });

    it('should ignore non-css templates', () => {
      const { source, ast } = createTestAst(`
        html\`<div></div>\`;
      `);
      expect(ast.type).toEqual('document');
      expect(ast.nodes.length).toEqual(0);
      expect(ast.source!.start).toEqual({
        line: 1,
        column: 1,
        offset: 0,
      });
      expect(ast.source!.input.css).toEqual(source);
    });
  });

  describe('formats', () => {
    it('should parse multiple stylesheets', () => {
      const { source, ast } = createTestAst(`
        css\`
          .foo { color: hotpink; }
        \`;

        css\`.bar: { background: lime; }\`;
      `);
      expect(ast.nodes.length).toEqual(2);
      const root1 = ast.nodes[0] as Root;
      const root2 = ast.nodes[1] as Root;

      expect(root1.type).toEqual('root');
      expect(root1.raws.codeBefore).toEqual('\n        css`\n');
      expect(root1.raws.codeAfter).toEqual(undefined);
      expect(root1.parent).toEqual(ast);

      expect(root2.type).toEqual('root');
      expect(root2.raws.codeBefore).toEqual('`;\n\n        css`');
      expect(root2.raws.codeAfter).toEqual('`;\n      ');
      expect(root2.parent).toEqual(ast);

      expect(ast.source!.start).toEqual({
        line: 1,
        column: 1,
        offset: 0,
      });
      expect(ast.source!.input.css).toEqual(source);
    });

    it('should parse multiple stylesheets indented differently', () => {
      const { source, ast } = createTestAst(`
        css\`
          .foo { color: hotpink; }
        \`;
        const classNames = {
          container: css\`
            .bar: { background: lime; }
          \`,
        };
      `);
      expect(ast.nodes.length).toEqual(2);
      const root1 = ast.nodes[0] as Root;
      const root2 = ast.nodes[1] as Root;

      expect(root1.type).toEqual('root');
      expect(root1.raws.codeBefore).toEqual('\n        css`\n');
      expect(root1.raws.codeAfter).toEqual(undefined);
      expect(root1.parent).toEqual(ast);

      expect(root2.type).toEqual('root');
      expect(root2.raws.codeBefore).toEqual('`;\n        const classNames = {\n          container: css`\n');
      expect(root2.raws.codeAfter).toEqual('`,\n        };\n      ');
      expect(root2.parent).toEqual(ast);

      expect(ast.source!.start).toEqual({
        line: 1,
        column: 1,
        offset: 0,
      });
      expect(ast.source!.input.css).toEqual(source);
    });

    it('should parse multi-line stylesheets', async () => {
      const { source, ast } = createTestAst(`
        css\`
          .foo {
            color: hotpink;
          }
        \`;
      `);
      const root = ast.nodes[0] as Root;
      const rule = root.nodes[0] as Rule;
      const colour = rule.nodes[0] as Declaration;
      expect(ast.type).toEqual('document');
      expect(root.type).toEqual('root');
      expect(rule.type).toEqual('rule');
      expect(colour.type).toEqual('decl');
      expect(root.raws.codeBefore).toEqual('\n        css`\n');
      expect(root.parent).toEqual(ast);
      expect(root.raws.codeAfter).toEqual('`;\n      ');
      expect(ast.source!.start).toEqual({
        line: 1,
        column: 1,
        offset: 0,
      });
      expect(ast.source!.input.css).toEqual(source);
    });
  });

  // it('should parse multi-line stylesheets containing expressions', async () => {
  //   const { source, ast } = createTestAst(`
  //     css\`
  //       .foo {
  //         color: hotpink;
  //         $\{expr}
  //       }
  //     \`;
  //   `);
  //   const root = ast.nodes[0] as Root;
  //   const rule = root.nodes[0] as Rule;
  //   const colour = rule.nodes[0] as Declaration;
  //   assert.equal(ast.type, 'document');
  //   assert.equal(root.type, 'root');
  //   assert.equal(rule.type, 'rule');
  //   assert.equal(colour.type, 'decl');
  //   assert.equal(root.raws.codeBefore, '\n      css`\n');
  //   assert.equal(root.parent, ast);
  //   assert.equal(root.raws.codeAfter, '`;\n    ');
  //   assert.deepEqual(ast.source!.start, {
  //     line: 1,
  //     column: 1,
  //     offset: 0,
  //   });
  //   assert.equal(ast.source!.input.css, source);
  // });

  // it('should parse CSS containing an expression', () => {
  //   const { source, ast } = createTestAst(`
  //     css\`
  //       .foo { $\{expr}color: hotpink; }
  //     \`;
  //   `);
  //   const root = ast.nodes[0] as Root;
  //   const rule = root.nodes[0] as Rule;
  //   const placeholder = rule.nodes[0] as Comment;
  //   const colour = rule.nodes[1] as Declaration;
  //   assert.equal(ast.type, 'document');
  //   assert.equal(root.type, 'root');
  //   assert.equal(rule.type, 'rule');
  //   assert.equal(placeholder.type, 'comment');
  //   assert.equal(colour.type, 'decl');
  //   assert.equal(ast.source!.input.css, source);
  // });
});
