import type { Document, Node } from 'postcss';

import { parse } from '../../src/parse';

export function createTestAst(source: string): {
  ast: Document;
  source: string;
} {
  const ast = parse(source) as Document;

  return { ast, source };
}

export function getSourceForNodeByLoc(source: string, node: Node): string {
  const loc = node.source;

  if (!loc || !loc.start || !loc.end) {
    return '';
  }

  const lines = source.split(/\r\n|\n/);
  const result: string[] = [];
  const startLineIndex = loc.start.line - 1;
  const endLineIndex = loc.end.line - 1;

  for (let i = startLineIndex; i < loc.end.line; i++) {
    const line = lines[i];
    if (line) {
      let offsetStart = 0;
      let offsetEnd = line.length;

      if (i === startLineIndex) {
        offsetStart = loc.start.column - 1;
      }

      if (i === endLineIndex) {
        offsetEnd = loc.end.column;
      }

      result.push(line.substring(offsetStart, offsetEnd));
    }
  }

  return result.join('\n');
}

export function getSourceForNodeByRange(source: string, node: Node): string {
  if (!node.source || !node.source.start || !node.source.end) {
    return '';
  }

  return source.substring(node.source.start.offset, node.source.end.offset + 1);
}

export const sourceWithExpression = {
  ruleset: `
    const expr = 'color: black';
    css\`
      $\{expr}
    \`;
  `,
  singleLineRuleset: `
    css\`
      \${expr0} { \${expr1}: \${expr2} }
    \`
  `,
  selectorOrAtRule: `
    const expr = '@media (min-width: 100px)';
    css\`
      $\{expr} {
        color: black;
      }
    \`;
  `,
  selectorBeforeExpression: `
    const expr = '.classname';
    css\`
      .example $\{expr} {
        color: black;
      }
    \`;
  `,
  selectorAfterExpression: `
    const expr = '.classname';
    css\`
      $\{expr} .example {
        color: black;
      }
    \`;
  `,
  declarationProperty: `
    const expr = 'color';
    css\`
      \${expr}: black;
    \`;
  `,
  declarationValue: `
    const expr = 'black';
    css\`
      color: \${expr};
    \`;
  `,
  declarationMultipleValues: `
    const expr1 = '10px';
    const expr2 = '5px';
    css\`
      margin: \${expr1} \${expr2} \${expr1} \${expr2};
    \`;
  `,
  declarationMixedValues: `
    const expr1 = '10px';
    const expr2 = '5px';
    css\`
      margin: \${expr1} 7px \${expr2} 9px;
    \`;
  `,
  combo: `
    css\`
      \${expr0}
      .foo {
        \${expr1}: \${expr2};
      }

      \${expr3} {
        .bar {
          color: black;
        }
      }
      \${expr4}
    \`;
  `,
};
