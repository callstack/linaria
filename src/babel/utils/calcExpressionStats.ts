import { types as t } from '@babel/core';

const cssCommentRegex = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//gm;

export type ExpressionMeta = {
  /* remove is true if the replacement is found within a CSS comment block */
  remove: boolean;
  nestLevel: number;
  index: number;
  placeholder: string;
  /* If placeholder is a selector */
  array: boolean;
  /* Whether an array is valid. If nestLevel <= 0 and attribute only appears as a selector */
  valid: boolean;
};

interface StrPath {
  node: {
    value: {
      cooked: string;
    };
  };
}

type Place = {
  name: string;
  array: boolean;
};

/**
 * Build out a temporary template. We replace interpolations with placeholders.
 * This allows us to ignore interpolations surrounded by CSS comments and track nesting level
 */
export default function(quasis: any, expressions: any[]) {
  let placeholders: Place[] = [];
  expressions.forEach((ex, i) => {
    let array = false;
    let name = `LINARIA_PLACEHOLDER_${i}`;
    if (t.isArrayExpression(ex)) {
      name = `ARRAY_${name}_ARRAY`;
      array = true;
    }

    placeholders[i] = {
      name,
      array,
    };
  });

  let quasiStrings: string[] = [];
  quasis.forEach((strPath: StrPath, i: number) => {
    let str = strPath.node.value.cooked;
    quasiStrings[i] = str;
  });
  let dummyCSS = ((literals, expressions) => {
    let string = '';
    for (const [i, val] of expressions.entries()) {
      string += literals[i] + val.name;
    }
    string += literals[literals.length - 1];
    return string;
  })(quasiStrings, placeholders);
  // Remove comments to calculate expressions that should be ignored:
  dummyCSS = dummyCSS.replace(cssCommentRegex, '');
  // Generate mapping for expression existance
  let expressionMeta: ExpressionMeta[] = [];
  placeholders.forEach((placeholder, i) => {
    let index = dummyCSS.indexOf(placeholder.name);
    expressionMeta[i] = {
      remove: index === -1,
      nestLevel: 0,
      index: index,
      placeholder: placeholder.name,
      array: placeholder.array,
      valid: false,
    };
  });

  let openBraces = findBraces('{', dummyCSS);
  let closeBraces = findBraces('}', dummyCSS);

  expressionMeta.forEach(exMeta => {
    let openDepth = 0;
    openBraces.forEach(pos => {
      if (pos < exMeta.index) openDepth += 1;
    });
    let closeDepth = 0;
    closeBraces.forEach(pos => {
      if (pos < exMeta.index) openDepth -= 1;
    });
    exMeta.nestLevel = openDepth - closeDepth;

    /**
     * Validate correct usage of dynamic attribute selectors:
     * Valid line  : &.${[props.primary, 1]} span {
     * Invalid line: &.span ${[props.primary, 1]} {
     * Invalid line: background: ${[props.primary, 1]};
     * Nesting is also invalid:
     * span { &.${[props.primary, 1]} }
     * However, we do allow parent selectors with spaces for theming:
     * .dark-mode &.${[props.primary]}
     * More complex nesting is not allowed and would require traversing the CSS AST:
     * &.${[props.round]} { &.${[props.primary]} }
     * Array attributes cannot be nested. All state is managed on the top level component.
     * We check for this early to bail out if required.
     * We do this because dynamic selectors only apply to the current styled element.
     * These restrictions also enable better optimization.
     */
    if (exMeta.array) {
      const dynamicAttrRegex = new RegExp(
        `^[\\v|\\t| ]*(\\.\\w)?([\\w|-]*[\\v|\\t| ])*&+\\.${
          exMeta.placeholder
        }.*{`,
        'm'
      );
      exMeta.valid = dynamicAttrRegex.test(dummyCSS) && exMeta.nestLevel <= 0;
    } else {
      exMeta.valid = true;
    }
  });

  return expressionMeta;
}

function findBraces(rxs: string, str: string) {
  const regex1 = RegExp(rxs, 'g');
  let match;
  let acc: number[] = [];
  while ((match = regex1.exec(str)) !== null) {
    match && acc.push(match.index);
  }
  return acc;
}
