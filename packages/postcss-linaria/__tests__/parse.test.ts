import type { Root, Rule, Declaration } from 'postcss';

import { placeholderText } from '../src/util';

import { createTestAst, sourceWithExpression } from './__utils__';

const {
  ruleset,
  singleLineRuleset,
  selectorOrAtRule,
  selectorBeforeExpression,
  selectorAfterExpression,
  declarationProperty,
  declarationValue,
  declarationMultipleValues,
  declarationMixedValues,
  combo,
} = sourceWithExpression;

describe('parse', () => {
  describe('expressions', () => {
    it('should parse a ruleset expression', () => {
      const { ast } = createTestAst(ruleset);
      const root = ast.nodes[0] as Root;
      expect(root.source?.input.css).toMatchInlineSnapshot(`
        "  /* ${placeholderText}:0 */
        "
      `);
    });

    it('should parse a single line ruleset expression', () => {
      const { ast } = createTestAst(singleLineRuleset);
      const root = ast.nodes[0] as Root;
      expect(root.source?.input.css).toMatchInlineSnapshot(`
        "  .${placeholderText}0 { --${placeholderText}1: ${placeholderText}2 }
        "
      `);
    });

    it('should parse a selector or at-rule expression', () => {
      const { ast } = createTestAst(selectorOrAtRule);
      const root = ast.nodes[0] as Root;
      expect(root.source?.input.css).toMatchInlineSnapshot(`
        "  .${placeholderText}0 {
            color: black;
          }
        "
      `);
    });

    it('should parse a selector expression with selectors before expression', () => {
      const { ast } = createTestAst(selectorBeforeExpression);
      const root = ast.nodes[0] as Root;
      expect(root.source?.input.css).toMatchInlineSnapshot(`
        "  .example .${placeholderText}0 {
            color: black;
          }
        "
      `);
    });

    it('should parse a selector expression with selectors after expression', () => {
      const { ast } = createTestAst(selectorAfterExpression);
      const root = ast.nodes[0] as Root;
      expect(root.source?.input.css).toMatchInlineSnapshot(`
        "  .${placeholderText}0 .example {
            color: black;
          }
        "
      `);
    });

    it('should parse a declaration property expression', () => {
      const { ast } = createTestAst(declarationProperty);
      const root = ast.nodes[0] as Root;
      expect(root.source?.input.css).toMatchInlineSnapshot(`
        "  --${placeholderText}0: black;
        "
      `);
    });

    it('should parse a declaration value with a single expression', () => {
      const { ast } = createTestAst(declarationValue);
      const root = ast.nodes[0] as Root;
      expect(root.source?.input.css).toMatchInlineSnapshot(`
        "  color: ${placeholderText}0;
        "
      `);
    });

    it('should parse a declaration value with multiple expressions', () => {
      const { ast } = createTestAst(declarationMultipleValues);
      const root = ast.nodes[0] as Root;
      expect(root.source?.input.css).toMatchInlineSnapshot(`
        "  margin: ${placeholderText}0 ${placeholderText}1 ${placeholderText}2 ${placeholderText}3;
        "
      `);
    });

    it('should parse a decl value with some but not all values as expressions', () => {
      const { ast } = createTestAst(declarationMixedValues);
      const root = ast.nodes[0] as Root;
      expect(root.source?.input.css).toMatchInlineSnapshot(`
        "  margin: ${placeholderText}0 7px ${placeholderText}1 9px;
        "
      `);
    });

    it('should parse a combinations of all expressions', () => {
      const { ast } = createTestAst(combo);
      const root = ast.nodes[0] as Root;
      expect(root.source?.input.css).toMatchInlineSnapshot(`
      "  /* ${placeholderText}:0 */
        .foo {
          --${placeholderText}1: ${placeholderText}2;
        }

        .${placeholderText}3 {
          .bar {
            color: black;
          }
        }
        /* ${placeholderText}:4 */
      "
      `);
    });
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

    it('should parse styled api', () => {
      const { source, ast } = createTestAst(`
        const StyledSpan = styled.span\`
          color: black;
        \`;
      `);
      expect(ast.nodes.length).toEqual(1);
      const root = ast.nodes[0] as Root;
      const color = root.nodes[0] as Declaration;
      expect(ast.type).toEqual('document');
      expect(root.type).toEqual('root');
      expect(color.type).toEqual('decl');
      expect(root.raws.codeBefore).toEqual(
        '\n        const StyledSpan = styled.span`\n'
      );
      expect(root.parent).toEqual(ast);
      expect(root.raws.codeAfter).toEqual('`;\n      ');
      expect(ast.source!.start).toEqual({
        line: 1,
        column: 1,
        offset: 0,
      });
      expect(ast.source!.input.css).toEqual(source);
    });

    it('should parse styled api with props', () => {
      const { source, ast } = createTestAst(`
        const StyledSpan = styled.span\`
          color: \${(props) => props.color};
        \`;
      `);
      expect(ast.nodes.length).toEqual(1);
      const root = ast.nodes[0] as Root;
      const color = root.nodes[0] as Declaration;
      expect(ast.type).toEqual('document');
      expect(root.type).toEqual('root');
      expect(color.type).toEqual('decl');
      expect(root.raws.codeBefore).toEqual(
        '\n        const StyledSpan = styled.span`\n'
      );
      expect(root.parent).toEqual(ast);
      expect(root.raws.codeAfter).toEqual('`;\n      ');
      expect(ast.source!.start).toEqual({
        line: 1,
        column: 1,
        offset: 0,
      });
      expect(ast.source!.input.css).toEqual(source);
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
      expect(root2.raws.codeBefore).toEqual(
        '`;\n        const classNames = {\n          container: css`\n'
      );
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

  it('should return empty document if babel cannot parse file', () => {
    const { ast } = createTestAst(`this is not valid source code for a file`);
    expect(ast.type).toEqual('document');
    expect(ast.raws).toEqual({});
    expect(ast.nodes.length).toEqual(0);
  });
});
