import type { Root, Rule, Declaration } from 'postcss';

import {
  createTestAst,
  getSourceForNodeByRange,
  getSourceForNodeByLoc,
} from './__utils__';

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
    const { source, ast } = createTestAst(`css\`.foo { color: hotpink; }\`;`);
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
});
