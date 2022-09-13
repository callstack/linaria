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
  return line[line.length - 2] === '{';
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
  return !(
    possibleRuleset.includes(':') ||
    hasCurlyBraceAfterExpression ||
    hasCommmaAfterExpression
  );
};

// mitigate issues with any stylelint error by providing placeholder text
// thats easier to trace back to postcss-linaria
export const placeholderText = 'postcss-linaria';
// avoid line length errors with shorter placeholder
export const shortPlaceholderText = 'lnria';

export const createPlaceholder = (
  i: number,
  sourceAsString: string,
  indexAfterExpression: number
): string => {
  if (isSelector(sourceAsString, indexAfterExpression)) {
    return `.${shortPlaceholderText}${i}`;
  }
  if (isProperty(sourceAsString, indexAfterExpression)) {
    return `--${placeholderText}${i}`;
  }
  if (isRuleSet(sourceAsString, indexAfterExpression)) {
    return `/* ${placeholderText}:${i} */`;
  }

  // assume it's a property value;
  // keep short to avoid accidental stylelint error for line length
  return `${shortPlaceholderText}${i}`;
};
