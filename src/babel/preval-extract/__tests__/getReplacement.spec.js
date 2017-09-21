/* eslint-disable no-template-curly-in-string */

import dedent from 'dedent';

import getReplacement from '../getReplacement';

describe('preval-extract/getReplacement module', () => {
  it('should output code with requirements on valid positions', () => {
    const fixtures = [
      'const defaults = { fontColor: "#ffffff" };',
      'function getColor() {\nreturn defaults.fontColor;\n};',
      'const fontSize = "14px";',
      'const styles = css`\ncolor: ${getColor()};\nfont-size: ${fontSize}\n`;',
    ];

    const requirements = [
      {
        code: fixtures[0],
        loc: { line: 1 },
      },
      {
        code: fixtures[1],
        loc: { line: 3 },
      },
      {
        code: fixtures[2],
        loc: { line: 7 },
      },
      {
        code: fixtures[3],
        loc: { line: 12 },
      },
    ];

    const code = getReplacement(requirements);

    const expectedOutput = dedent`
    ${fixtures[0]}

    ${fixtures[1]}

    ${fixtures[2]}




    ${fixtures[3]}
    /* linaria-preval */
    `;

    expect(code).toEqual(expectedOutput);
  });
});
