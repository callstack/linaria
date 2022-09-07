import { default as generate } from '@babel/generator';
import { parse } from '@babel/parser';
import type { NodePath } from '@babel/traverse';
import { default as traverse } from '@babel/traverse';
import type { TaggedTemplateExpression } from '@babel/types';

/**
 * Extracts the HTML templates from a given JS source code string.
 * @param {string} content JS source code
 * @return {string}
 */
export function stripStyles(content: string): string {
  const ast = parse(content, {
    sourceType: 'unambiguous',
    plugins: ['typescript', ['decorators', { decoratorsBeforeExport: true }]],
    ranges: true,
  });

  traverse(ast, {
    TaggedTemplateExpression: (
      path: NodePath<TaggedTemplateExpression>
    ): void => {
      if (path.node.tag.type === 'Identifier' && path.node.tag.name === 'css') {
        path.remove();
      }
    },
  });

  const { code } = generate(ast);

  return code;
}
