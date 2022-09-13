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

const hasCharactersBeforeExpression = (line: string) => {
  const expressionBeginsIndex = line.indexOf('$');
  const hasNonSpaceCharactersRegex = /[^\s]/;
  return (
    line.slice(0, expressionBeginsIndex).search(hasNonSpaceCharactersRegex) > 0
  );
};

const hasCharactersAfterExpression = (line: string) => {
  const expressionEndsIndex = line.indexOf('}');
  const hasNonSpaceCharactersRegex = /[^\s]/;
  return (
    line.slice(expressionEndsIndex + 1).search(hasNonSpaceCharactersRegex) > 0
  );
};

const isAtRule = (sourceAsString: string, indexAfterExpression: number) => {
  const { line } = getLine(sourceAsString, indexAfterExpression);
  const hasCharacters = hasCharactersBeforeExpression(line);
  return sourceAsString[indexAfterExpression + 1] === '{' && !hasCharacters;
};

const isSelector = (sourceAsString: string, indexAfterExpression: number) => {
  const { line } = getLine(sourceAsString, indexAfterExpression);
  const hasCharactersBefore = hasCharactersBeforeExpression(line);
  const hasCharactersAfter = hasCharactersAfterExpression(line);
  const hasCharacters = hasCharactersBefore || hasCharactersAfter;
  return line[line.length - 2] === '{' && hasCharacters;
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

export const placeholderText = 'postcss-linaria';
export const shortPlaceholderText = 'lnria';

export const createPlaceholder = (
  i: number,
  sourceAsString: string,
  indexAfterExpression: number
): string => {
  if (isAtRule(sourceAsString, indexAfterExpression)) {
    return `@${placeholderText}${i}`;
  }
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
