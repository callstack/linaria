import type { Root, Rule, Declaration } from 'postcss';

import syntax from '../src/index';
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

describe('stringify', () => {
  describe('with expressions', () => {
    it('should stringify a ruleset expression', () => {
      const { source, ast } = createTestAst(ruleset);
      const output = ast.toString(syntax);
      expect(output).toEqual(source);
    });

    it('should stringify a single line ruleset expression', () => {
      const { source, ast } = createTestAst(singleLineRuleset);
      const output = ast.toString(syntax);
      expect(output).toEqual(source);
    });

    it('should stringify a selector or at-rule expression', () => {
      const { source, ast } = createTestAst(selectorOrAtRule);
      const output = ast.toString(syntax);
      expect(output).toEqual(source);
    });

    it('should stringify selector expression with a selector before the expression', () => {
      const { source, ast } = createTestAst(selectorBeforeExpression);
      const output = ast.toString(syntax);
      expect(output).toEqual(source);
    });

    it('should stringify selector expression with a selector after the expression', () => {
      const { source, ast } = createTestAst(selectorAfterExpression);
      const output = ast.toString(syntax);
      expect(output).toEqual(source);
    });

    it('should stringify a declaration property expression', () => {
      const { source, ast } = createTestAst(declarationProperty);
      const output = ast.toString(syntax);
      expect(output).toEqual(source);
    });

    it('should stringify a declaration value with a single expression', () => {
      const { source, ast } = createTestAst(declarationValue);
      const output = ast.toString(syntax);
      expect(output).toEqual(source);
    });

    it('should stringify a declaration value with multiple expressions', () => {
      const { source, ast } = createTestAst(declarationMultipleValues);
      const output = ast.toString(syntax);
      expect(output).toEqual(source);
    });

    it('should stringify a decl value with some but not all values as expressions', () => {
      const { source, ast } = createTestAst(declarationMixedValues);
      const output = ast.toString(syntax);
      expect(output).toEqual(source);
    });

    it('should stringify a combinations of all expressions', () => {
      const { source, ast } = createTestAst(combo);
      const output = ast.toString(syntax);
      expect(output).toEqual(source);
    });
  });

  it('should stringify basic CSS', () => {
    const { source, ast } = createTestAst(`
      css\`
        .foo { color: hotpink; }
      \`;
    `);

    const output = ast.toString(syntax);
    expect(output).toEqual(source);
  });

  it('should stringify single-line expressions', () => {
    const { source, ast } = createTestAst(`
      css\`
        .foo { $\{expr}: hotpink; }
      \`;
    `);

    const output = ast.toString(syntax);

    expect(output).toEqual(source);
  });

  it('should stringify multiple expressions', () => {
    const { source, ast } = createTestAst(`
      css\`
        .foo { $\{expr}: hotpink; }
        .bar { $\{expr2}: lime; }
      \`;
    `);

    const output = ast.toString(syntax);

    expect(output).toEqual(source);
  });

  it('should stringify multiple same-named expressions', () => {
    const { source, ast } = createTestAst(`
      css\`
        .foo { $\{expr}: hotpink; }
        .bar { $\{expr}: lime; }
      \`;
    `);

    const output = ast.toString(syntax);

    expect(output).toEqual(source);
  });

  it('should stringify multiple stylesheets', () => {
    const { source, ast } = createTestAst(`
      css\`
        .foo { color: hotpink; }
      \`;

      const somethingInTheMiddle = 808;

      css\`.foo { color: lime; }\`;
    `);

    const output = ast.toString(syntax);

    expect(output).toEqual(source);
  });

  it('should handle deleted (by another plugin) expression state', () => {
    const { ast } = createTestAst(`
      css\`
        .foo { $\{expr}: hotpink; }
      \`;
    `);

    const root = ast.nodes[0]!;
    root.raws.linariaTemplateExpressions = undefined;
    const output = ast.toString(syntax);

    expect(output).toEqual(
      `
      css\`
        .foo { --${placeholderText}0: hotpink; }
      \`;
    `
    );
  });

  it('should ignore non-placeholder comments', () => {
    const { source, ast } = createTestAst(`
      css\`
        /* random comment about this line */
        .foo {
          color: hotpink; 
        }
      \`;
    `);

    const output = ast.toString(syntax);

    expect(output).toEqual(source);
  });

  it('should handle base indentations', () => {
    const { source, ast } = createTestAst(`
      css\`
        .foo {
          color: hotpink;
        }

        .bar {
          border: 808em solid cyan;
        }
      \`;
    `);

    const output = ast.toString(syntax);

    expect(output).toEqual(source);
  });

  it('should deal with multi-line rules', () => {
    const { source, ast } = createTestAst(`
      css\`
        .foo,
          .bar {
            color: hotpink;
        }

        .x,
        .x > .y {
  font-size: 32em;
        }
      \`;
    `);

    const output = ast.toString(syntax);

    expect(output).toEqual(source);
  });

  it('should deal with multi-line declarations', () => {
    const { source, ast } = createTestAst(`
      css\`
        .foo {
          margin:
            1px
            2px
            3px
            4px;
        }

        .bar {
          margin: 1px
            2px
            3px;
        }
      \`;
    `);

    const output = ast.toString(syntax);

    expect(output).toEqual(source);
  });

  it('should deal with unusual between values', () => {
    const { source, ast } = createTestAst(`
      css\`
        .foo {
          margin
            :
              10px;
        }
      \`;
    `);

    const output = ast.toString(syntax);

    expect(output).toEqual(source);
  });

  it('should deal with unusual before values', () => {
    const { source, ast } = createTestAst(`
      css\`
        .foo {
          margin: 10px;

          ;

          margin: 20px;
        }
      \`;
    `);

    const output = ast.toString(syntax);

    expect(output).toEqual(source);
  });

  it('should deal with unusual after values', () => {
    const { source, ast } = createTestAst(`
      css\`
        .foo {
          margin:
            1px
            2px;

          ;

        }
      \`;
    `);

    const output = ast.toString(syntax);

    expect(output).toEqual(source);
  });

  it('should stringify non-css JS', () => {
    const { source, ast } = createTestAst(`
      const a = 5;
      const b = 303;
    `);

    const output = ast.toString(syntax);

    expect(output).toEqual(source);
  });

  it('should stringify empty CSS', () => {
    const { source, ast } = createTestAst(`
      css\`\`;
    `);

    const output = ast.toString(syntax);

    expect(output).toEqual(source);
  });

  it('should stringify single-line CSS', () => {
    const { source, ast } = createTestAst(`
      css\`.foo { color: hotpink; }\`;
    `);

    const output = ast.toString(syntax);

    expect(output).toEqual(source);
  });

  it('should escape backticks', () => {
    const { ast } = createTestAst(`
      css\`.foo { color: hotpink; }\`;
    `);

    const root = ast.nodes[0] as Root;
    const rule = root.nodes[0] as Rule;
    const colour = rule.nodes[0] as Declaration;

    colour.raws.between = ': /*comment with `backticks`*/';

    const output = ast.toString(syntax);
    expect(output).toEqual(
      `
      css\`.foo { color: /*comment with \\\`backticks\\\`*/hotpink; }\`;
    `
    );
  });

  it('should not escape unrelated backticks', () => {
    const { ast } = createTestAst(`
      html\`<div></div>\`;
    `);
    const output = ast.toString(syntax);

    expect(output).toEqual(
      `
      html\`<div></div>\`;
    `
    );
  });

  it('should not escape unrelated backslashes', () => {
    const { ast } = createTestAst(`
      const foo = 'abc\\def';
    `);
    const output = ast.toString(syntax);

    expect(output).toEqual(
      `
      const foo = 'abc\\def';
    `
    );
  });

  it('should escape backslashes', () => {
    const { ast } = createTestAst(`
      css\`.foo { color: hotpink; }\`;
    `);

    const root = ast.nodes[0] as Root;
    const rule = root.nodes[0] as Rule;

    rule.selector = '.foo\\:bar';

    const output = ast.toString(syntax);
    expect(output).toEqual(
      `
      css\`.foo\\\\:bar { color: hotpink; }\`;
    `
    );
  });

  it('should stringify styled API', () => {
    const { source, ast } = createTestAst(`
      styled.h1\`
        .foo { width: \${p => p.size}px; }
      \`
    `);
    const output = ast.toString(syntax);
    expect(output).toEqual(source);
  });
});
