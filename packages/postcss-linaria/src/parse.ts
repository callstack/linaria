import { parse as babelParse } from '@babel/parser';
import type { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import type { Identifier, TaggedTemplateExpression } from '@babel/types';
import type { Parser, Root, ProcessOptions } from 'postcss';
import { Document, Input } from 'postcss';
import postcssParse from 'postcss/lib/parse';

import { locationCorrectionWalker } from './locationCorrection';
import { createPlaceholder } from './util';

// This function returns
// 1) styleText with placeholders for the expressions.
//    for example:
//      `${selector} { ${property} : ${value} }`
//    becomes
//      `.pcss-lin0 { --pcss-lin1: pcss-lin2 }`
// 2) an array of the expressions:
// ['${selector}', '${property}', '${value}']
const generateStyleTextWithExpressionPlaceholders = (
  node: TaggedTemplateExpression,
  sourceAsString: string
): { styleText: string; expressionStrings: string[] } => {
  let styleText = '';
  const expressionStrings: string[] = [];

  for (let i = 0; i < node.quasi.quasis.length; i++) {
    const template = node.quasi.quasis[i];
    const expr = node.quasi.expressions[i];
    const nextTemplate = node.quasi.quasis[i + 1];
    if (template) {
      styleText += template.value.raw;

      if (expr && nextTemplate && nextTemplate.range && template.range) {
        const exprText = sourceAsString.slice(
          template.range[1],
          nextTemplate.range[0]
        );
        styleText += createPlaceholder(
          i,
          sourceAsString,
          nextTemplate.range[0]
        );
        expressionStrings.push(exprText);
      }
    }
  }
  return { styleText, expressionStrings };
};

const getDeindentedStyleTextAndOffsets = (
  styleText: string,
  node: TaggedTemplateExpression
) => {
  const baseIndentation = (node.quasi.loc?.end.column ?? 1) - 1;
  const sourceLines = styleText.split('\n');
  const baseIndentations = new Map<number, number>();
  const indentationPattern = new RegExp(`^[ \\t]{${baseIndentation}}`);
  const emptyLinePattern = /^[ \\t\r]*$/;
  const deindentedLines: string[] = [];
  const prefixOffsets = { lines: 0, offset: 0 };

  // remove the first line if it's an empty string and update the prefix
  // offset to be the lines 1 instead of lines 0
  if (
    sourceLines.length > 1 &&
    sourceLines[0] !== undefined &&
    emptyLinePattern.test(sourceLines[0])
  ) {
    prefixOffsets.lines = 1;
    prefixOffsets.offset = sourceLines[0].length + 1;
    sourceLines.shift();
  }

  // go through each source line and deindent lines
  for (let i = 0; i < sourceLines.length; i++) {
    const sourceLine = sourceLines[i];
    if (sourceLine !== undefined) {
      // if the sourceline has the indentation pattern
      if (indentationPattern.test(sourceLine)) {
        deindentedLines.push(sourceLine.replace(indentationPattern, ''));
        baseIndentations.set(i + 1, baseIndentation);
        // Roots don't have an end line, so we can't look this up so easily
        // later on. Having a special '-1' key helps here.
        if (i === sourceLines.length - 1) {
          baseIndentations.set(-1, baseIndentation);
        }
      } else {
        deindentedLines.push(sourceLine);
      }
    }
  }

  const deindentedStyleText = deindentedLines.join('\n');
  return { deindentedStyleText, prefixOffsets, baseIndentations };
};

/**
 * Parses CSS from within tagged template literals in a JavaScript document
 * @param {string} source Source code to parse
 * @param {*=} opts Options to pass to PostCSS' parser when parsing
 * @return {Root|Document}
 */
export const parse: Parser<Root | Document> = (
  source: string | { toString(): string },
  opts?: Pick<ProcessOptions, 'map' | 'from'>
): Root | Document => {
  const doc = new Document();
  const sourceAsString = source.toString();

  // avoid error spam (and vscode error toasts) if babel can't parse doc
  // allows user to type new code without constant warnings
  let ast;
  try {
    ast = babelParse(sourceAsString, {
      sourceType: 'unambiguous',
      plugins: ['typescript', 'jsx'],
      ranges: true,
    });
  } catch {
    return doc;
  }
  const extractedStyles = new Set<TaggedTemplateExpression>();

  traverse(ast, {
    TaggedTemplateExpression: (
      path: NodePath<TaggedTemplateExpression>
    ): void => {
      if (
        path.node.tag.type === 'Identifier' &&
        path.node.tag.name.includes('css')
      ) {
        extractedStyles.add(path.node);
      }

      if (path.node.tag.type === 'MemberExpression') {
        if ((path.node.tag.object as Identifier).name === 'styled') {
          extractedStyles.add(path.node);
        }
      }
    },
  });

  let currentOffset = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const node of extractedStyles) {
    if (!node.quasi.range) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const startIndex = node.quasi.range[0] + 1;

    const { styleText, expressionStrings } =
      generateStyleTextWithExpressionPlaceholders(node, sourceAsString);

    const { deindentedStyleText, prefixOffsets, baseIndentations } =
      getDeindentedStyleTextAndOffsets(styleText, node);

    const root = postcssParse(deindentedStyleText, {
      ...opts,
      map: false,
    }) as Root;

    root.raws.linariaPrefixOffsets = prefixOffsets;
    root.raws.linariaTemplateExpressions = expressionStrings;
    root.raws.linariaBaseIndentations = baseIndentations;
    // TODO: remove this if stylelint/stylelint#5767 ever gets fixed,
    // or they drop the indentation rule. Their indentation rule depends on
    // `beforeStart` existing as they unsafely try to call `endsWith` on it.
    if (!root.raws.beforeStart) {
      root.raws.beforeStart = '';
    }
    root.raws.codeBefore = sourceAsString.slice(
      currentOffset,
      startIndex + prefixOffsets.offset
    );
    root.parent = doc;
    // TODO: stylelint relies on this existing, really unsure why.
    // it could just access root.parent to get the document...
    (root as Root & { document: Document }).document = doc;
    const walker = locationCorrectionWalker(node, sourceAsString);
    walker(root);
    root.walk(walker);
    doc.nodes.push(root);

    currentOffset = node.quasi.range[1] - 1;
  }

  if (doc.nodes.length > 0) {
    const last = doc.nodes[doc.nodes.length - 1];
    if (last) {
      last.raws.codeAfter = sourceAsString.slice(currentOffset);
    }
  }

  doc.source = {
    input: new Input(sourceAsString, opts),
    start: {
      line: 1,
      column: 1,
      offset: 0,
    },
  };

  return doc;
};
