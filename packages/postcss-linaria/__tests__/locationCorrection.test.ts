import type { Root, Rule, Declaration, Comment } from 'postcss';

import {
  createTestAst,
  getSourceForNodeByRange,
  getSourceForNodeByLoc,
  sourceWithExpression,
} from './__utils__';

const {
  ruleset,
  selectorOrAtRule,
  selectorBeforeExpression,
  selectorAfterExpression,
  declarationProperty,
  declarationValue,
  declarationMultipleValues,
  declarationMixedValues,
} = sourceWithExpression;

describe('locationCorrection', () => {
  it('should translate basic CSS positions', () => {
    const { source, ast } = createTestAst(`
      css\`
        .foo { color: hotpink; }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const color = rule.nodes[0] as Declaration;
    expect(color.type).toEqual('decl');
    expect(rule.type).toEqual('rule');
    expect(getSourceForNodeByLoc(source, rule)).toEqual(
      '.foo { color: hotpink; }'
    );
    expect(getSourceForNodeByLoc(source, color)).toEqual('color: hotpink;');
    expect(getSourceForNodeByRange(source, rule)).toEqual(
      '.foo { color: hotpink; }'
    );
    expect(getSourceForNodeByRange(source, color)).toEqual('color: hotpink;');
  });

  it('should handle multi-line CSS', () => {
    const { source, ast } = createTestAst(`
      css\`
        .foo {
          color: hotpink;
        }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const color = rule.nodes[0] as Declaration;
    expect(color.type).toEqual('decl');
    expect(rule.type).toEqual('rule');
    expect(getSourceForNodeByLoc(source, rule)).toEqual(
      `.foo {
          color: hotpink;
        }`
    );
    expect(getSourceForNodeByLoc(source, color)).toEqual('color: hotpink;');
    expect(getSourceForNodeByRange(source, rule)).toEqual(
      `.foo {
          color: hotpink;
        }`
    );
    expect(getSourceForNodeByRange(source, color)).toEqual('color: hotpink;');
  });

  it('should handle multi-line CSS with expressions', () => {
    const { source, ast } = createTestAst(`
      css\`
        .foo {
          color: hotpink;
          $\{expr}
        }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const color = rule.nodes[0] as Declaration;
    expect(color.type).toEqual('decl');
    expect(rule.type).toEqual('rule');
    expect(getSourceForNodeByLoc(source, rule)).toEqual(
      `.foo {
          color: hotpink;
          $\{expr}
        }`
    );
    expect(getSourceForNodeByLoc(source, color)).toEqual('color: hotpink;');
    expect(getSourceForNodeByRange(source, rule)).toEqual(
      `.foo {
          color: hotpink;
          $\{expr}
        }`
    );
    expect(getSourceForNodeByRange(source, color)).toEqual('color: hotpink;');
  });

  it('should handle single line expressions', () => {
    const { source, ast } = createTestAst(`css\`.foo { color: \${expr}; }\`;`);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const color = rule.nodes[0] as Declaration;
    expect(color.type).toEqual('decl');
    expect(rule.type).toEqual('rule');
    expect(getSourceForNodeByLoc(source, rule)).toEqual(
      '.foo { color: ${expr}; }'
    );
    expect(getSourceForNodeByLoc(source, color)).toEqual('color: ${expr};');
    expect(getSourceForNodeByRange(source, rule)).toEqual(
      '.foo { color: ${expr}; }'
    );
    expect(getSourceForNodeByRange(source, color)).toEqual('color: ${expr};');
  });

  it('should handle multi-line CSS with value expression', () => {
    const { source, ast } = createTestAst(`
      css\`
        .foo {
          color: $\{expr1};
        }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const color = rule.nodes[0] as Declaration;
    expect(color.type).toEqual('decl');
    expect(rule.type).toEqual('rule');
    expect(getSourceForNodeByLoc(source, rule)).toEqual(
      `.foo {
          color: $\{expr1};
        }`
    );
    expect(getSourceForNodeByLoc(source, color)).toEqual('color: ${expr1};');
    expect(getSourceForNodeByRange(source, rule)).toEqual(
      `.foo {
          color: $\{expr1};
        }`
    );
    expect(getSourceForNodeByRange(source, color)).toEqual(
      'color: ${expr1};\n'
    );
  });

  it('should stringify a ruleset expression', () => {
    const { source, ast } = createTestAst(ruleset);
    const node = (ast.nodes[0] as Root).nodes[0] as Comment;
    expect(node.type).toEqual('comment');
    expect(getSourceForNodeByLoc(source, node)).toEqual('${expr}');
    expect(getSourceForNodeByRange(source, node)).toEqual('${expr}');
  });

  it('should stringify a selector or at-rule expression', () => {
    const { source, ast } = createTestAst(selectorOrAtRule);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    expect(rule.type).toEqual('rule');
    expect(getSourceForNodeByLoc(source, rule)).toEqual(
      `$\{expr} {
        color: black;
      }`
    );
    expect(getSourceForNodeByRange(source, rule)).toEqual(
      `$\{expr} {
        color: black;
      }`
    );
  });

  it('should stringify selector expression with a selector before the expression', () => {
    const { source, ast } = createTestAst(selectorBeforeExpression);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    expect(rule.type).toEqual('rule');
    expect(getSourceForNodeByLoc(source, rule)).toEqual(
      `.example $\{expr} {
        color: black;
      }`
    );
    expect(getSourceForNodeByRange(source, rule)).toEqual(
      `.example $\{expr} {
        color: black;
      }`
    );
  });

  it('should stringify selector expression with a selector after the expression', () => {
    const { source, ast } = createTestAst(selectorAfterExpression);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    expect(rule.type).toEqual('rule');
    expect(getSourceForNodeByLoc(source, rule)).toEqual(
      `$\{expr} .example {
        color: black;
      }`
    );
    expect(getSourceForNodeByRange(source, rule)).toEqual(
      `$\{expr} .example {
        color: black;
      }`
    );
  });

  it('should stringify a declaration property expression', () => {
    const { source, ast } = createTestAst(declarationProperty);
    const color = (ast.nodes[0] as Root).nodes[0] as Declaration;
    expect(color.type).toEqual('decl');
    expect(getSourceForNodeByLoc(source, color)).toEqual('${expr}: black;');
    expect(getSourceForNodeByRange(source, color)).toEqual('${expr}: black;');
  });

  it('should stringify a declaration value with a single expression', () => {
    const { source, ast } = createTestAst(declarationValue);
    const color = (ast.nodes[0] as Root).nodes[0] as Declaration;
    expect(color.type).toEqual('decl');
    expect(getSourceForNodeByLoc(source, color)).toEqual('color: ${expr};');
    expect(getSourceForNodeByRange(source, color)).toEqual('color: ${expr};');
  });

  it('should stringify a declaration value with multiple expressions', () => {
    const { source, ast } = createTestAst(declarationMultipleValues);
    const margin = (ast.nodes[0] as Root).nodes[0] as Declaration;
    expect(margin.type).toEqual('decl');
    expect(getSourceForNodeByLoc(source, margin)).toEqual(
      'margin: ${expr1} ${expr2} ${expr1} ${expr2};'
    );
    expect(getSourceForNodeByRange(source, margin)).toEqual(
      'margin: ${expr1} ${expr2} ${expr1} ${expr2};'
    );
  });

  it('should stringify a decl value with some but not all values as expressions', () => {
    const { source, ast } = createTestAst(declarationMixedValues);
    const margin = (ast.nodes[0] as Root).nodes[0] as Declaration;
    expect(margin.type).toEqual('decl');
    expect(getSourceForNodeByLoc(source, margin)).toEqual(
      'margin: ${expr1} 7px ${expr2} 9px;'
    );
    expect(getSourceForNodeByRange(source, margin)).toEqual(
      'margin: ${expr1} 7px ${expr2} 9px;'
    );
  });

  it('should account for code before', () => {
    const { source, ast } = createTestAst(`
      const foo = bar + baz;
      css\`
        .foo { color: hotpink; }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const color = rule.nodes[0] as Declaration;
    expect(color.type).toEqual('decl');
    expect(rule.type).toEqual('rule');
    expect(getSourceForNodeByLoc(source, rule)).toEqual(
      '.foo { color: hotpink; }'
    );
    expect(getSourceForNodeByLoc(source, color)).toEqual('color: hotpink;');
    expect(getSourceForNodeByRange(source, rule)).toEqual(
      '.foo { color: hotpink; }'
    );
    expect(getSourceForNodeByRange(source, color)).toEqual('color: hotpink;');
  });

  it('should account for mixed indentation', () => {
    const { source, ast } = createTestAst(`
      css\`
  .foo { $\{expr}: hotpink; }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const color = rule.nodes[0] as Declaration;
    expect(color.type).toEqual('decl');
    expect(rule.type).toEqual('rule');
    expect(getSourceForNodeByLoc(source, rule)).toEqual(
      '.foo { ${expr}: hotpink; }'
    );
    expect(getSourceForNodeByLoc(source, color)).toEqual('${expr}: hotpink;');
    expect(getSourceForNodeByRange(source, rule)).toEqual(
      '.foo { ${expr}: hotpink; }'
    );
    expect(getSourceForNodeByRange(source, color)).toEqual('${expr}: hotpink;');
  });
});
