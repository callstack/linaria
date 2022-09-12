const isAtRule = (sourceAsString: string, indexAfterExpression: number) => {
  return sourceAsString[indexAfterExpression + 1] === '{';
};

const isProperty = (sourceAsString: string, indexAfterExpression: number) => {
  return sourceAsString[indexAfterExpression] === ':';
};

const isRuleSet = (sourceAsString: string, indexAfterExpression: number) => {
  return (
    sourceAsString.indexOf('\n', indexAfterExpression - 1) ===
    indexAfterExpression
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
