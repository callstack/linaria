export const createPlaceholder = (i: number): string => `/*linaria:${i}*/`;

const isAtRule = (sourceAsString: string, indexAfterExpression: number) => {
  return sourceAsString[indexAfterExpression + 1] === '{';
};

const isProperty = (sourceAsString: string, indexAfterExpression: number) => {
  return sourceAsString[indexAfterExpression] === ':';
};

const isRuleSet = (sourceAsString: string, indexAfterExpression: number) => {
  return sourceAsString.indexOf('\n', indexAfterExpression-1) === indexAfterExpression;
};

export const smartCreatePlaceholder = (
  i: number,
  sourceAsString: string,
  indexAfterExpression: number
): string => {
  if (isAtRule(sourceAsString, indexAfterExpression)) {
    return `@linaria${i}`;
  }
  if (isProperty(sourceAsString, indexAfterExpression)) {
    return `linaria${i}`;
  }
  if (isRuleSet(sourceAsString, indexAfterExpression)) {
    return `/* linaria:${i} */`;
  }

  // assume it's a property value;
  return `linaria${i}`;
};
