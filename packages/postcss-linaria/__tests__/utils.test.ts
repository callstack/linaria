import { createPlaceholder, placeholderText } from '../src/util';

describe('createPlaceholder', () => {
  it('should create a placeholder for a selector expression', () => {
    const expressionCounter = 0;
    const sourceAsString = `
      const expr = '@media (min-width: 100px)';
      css\`
        $\{expr} {
          color: black;
        }
      \`;
    `;
    const indexAfterExpression = sourceAsString.indexOf('}') + 1;
    const result = createPlaceholder(
      expressionCounter,
      sourceAsString,
      indexAfterExpression
    );
    expect(result).toEqual(`.${placeholderText}${expressionCounter}`);
  });

  it('should create a placeholder for a property expression', () => {
    const expressionCounter = 0;
    const sourceAsString = `
      const expr = 'color';
      css\`
        \${expr}: black;
      \`;
    `;
    const indexAfterExpression = sourceAsString.indexOf('}') + 1;
    const result = createPlaceholder(
      expressionCounter,
      sourceAsString,
      indexAfterExpression
    );
    expect(result).toEqual(`--${placeholderText}${expressionCounter}`);
  });

  it('should create a placeholder for a ruleset expression', () => {
    const expressionCounter = 0;
    const sourceAsString = `
      const expr = 'color: black';
      css\`
        $\{expr}
      \`;
    `;
    const indexAfterExpression = sourceAsString.indexOf('}') + 1;
    const result = createPlaceholder(
      expressionCounter,
      sourceAsString,
      indexAfterExpression
    );
    expect(result).toEqual(`/* ${placeholderText}:${expressionCounter} */`);
  });

  it('should create a placeholder for a value expression', () => {
    const expressionCounter = 0;
    const sourceAsString = `
      const expr = 'black';
      css\`
        color: \${expr};
      \`;
    `;
    const indexAfterExpression = sourceAsString.indexOf('}') + 1;
    const result = createPlaceholder(
      expressionCounter,
      sourceAsString,
      indexAfterExpression
    );
    expect(result).toEqual(`${placeholderText}${expressionCounter}`);
  });
});
