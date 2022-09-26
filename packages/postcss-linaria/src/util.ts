const getLine = (sourceAsString: string, indexAfterExpression: number) => {
  const begginningOfLineIndex =
    sourceAsString.lastIndexOf('\n', indexAfterExpression) || 0;
  const endOfLineIndex =
    sourceAsString.indexOf('\n', indexAfterExpression - 1) || Infinity;
  const indexAfterExpressionInLine =
    indexAfterExpression - begginningOfLineIndex;
  return {
    line: sourceAsString.substring(begginningOfLineIndex, endOfLineIndex + 1),
    indexAfterExpressionInLine,
  };
};

const isSelector = (sourceAsString: string, indexAfterExpression: number) => {
  const { line } = getLine(sourceAsString, indexAfterExpression);
  const isSingleLineRule =
    line.indexOf('{', indexAfterExpression) > 0 &&
    line.indexOf('}', indexAfterExpression) > 0;
  return isSingleLineRule || line[line.length - 2] === '{';
};

const isProperty = (sourceAsString: string, indexAfterExpression: number) => {
  return sourceAsString[indexAfterExpression] === ':';
};

// no ':' or '{' on the line
const isRuleSet = (sourceAsString: string, indexAfterExpression: number) => {
  const { line: possibleRuleset, indexAfterExpressionInLine } = getLine(
    sourceAsString,
    indexAfterExpression
  );
  const hasCurlyBraceAfterExpression =
    possibleRuleset.indexOf('{', indexAfterExpressionInLine) > 0;
  const hasCommmaAfterExpression =
    possibleRuleset.indexOf(',', indexAfterExpressionInLine) > 0;

  // check if possible ruleset has ':' and outside of the func args if expression has a func
  // i.e. avoid false postivive for `${func({ key: value })}
  const indexOfOpenParenthesis = possibleRuleset.indexOf('(');
  const indexOfClosedParenthesis = possibleRuleset.indexOf(')');
  const hasFuncInExpression =
    indexOfOpenParenthesis > 0 && indexOfClosedParenthesis > 0;
  let hasColonOutsideOfExpression = possibleRuleset.includes(':');
  if (hasFuncInExpression) {
    hasColonOutsideOfExpression =
      possibleRuleset.lastIndexOf(':', indexOfOpenParenthesis) > 0 &&
      possibleRuleset.indexOf(':', indexOfClosedParenthesis) > 0;
  }

  return !(
    hasColonOutsideOfExpression ||
    hasCurlyBraceAfterExpression ||
    hasCommmaAfterExpression
  );
};

export const placeholderText = 'pcss-lin';

export const createPlaceholder = (
  i: number,
  sourceAsString: string,
  indexAfterExpression: number
): string => {
  if (isSelector(sourceAsString, indexAfterExpression)) {
    return `.${placeholderText}${i}`;
  }
  if (isProperty(sourceAsString, indexAfterExpression)) {
    return `--${placeholderText}${i}`;
  }
  if (isRuleSet(sourceAsString, indexAfterExpression)) {
    return `/* ${placeholderText}:${i} */`;
  }

  // assume it's a property value or part of another string;
  return `${placeholderText}${i}`;
};
