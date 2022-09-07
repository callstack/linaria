/* istanbul ignore file */
import type { Document, Node } from 'postcss';

import { parse } from '../src/parse';

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
