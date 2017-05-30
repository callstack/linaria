/* eslint-env jest */

import * as babel from 'babel-core';
import path from 'path';

const transpile = source => {
  return babel.transform(source, {
    plugins: [path.resolve('src/babel/index.js')],
    babelrc: false,
  });
};

const noCssTagFixture = `
const header = \`
  font-size: 3em;
\`;
`;

const unresolvedExprFixture = `
const header = css\`
  font-size: \${heading}em;
\`;
`;

const simpleFixture = `
const header = css\`
  font-size: 3em;
\`;
`;

const multilineFixture = `
const header = css\`
  font-size: 3em;
  color: red;
  border: 1px solid #000;
\`;
`;

describe('babel plugin', () => {
  it('should not process tagged template if tag is not `css`', () => {
    expect(`${transpile(noCssTagFixture).code}\n`).toEqual(noCssTagFixture);
  });

  it('should fail if there are any unresolved expressions in tagged template', () => {
    expect(() => {
      transpile(unresolvedExprFixture);
    }).toThrowError(
      'No unresolved expressions in style tagged template literal allowed'
    );
  });

  it('should generate hash and inject it into `css.named` call for simple fixture', () => {
    const { code } = transpile(simpleFixture);
    expect(code.includes('header_')).toBeTruthy();
    expect(code).toMatchSnapshot();
    // Check if generated hash is the same
    expect(transpile(simpleFixture).code).toMatchSnapshot();
  });

  it('should generate hash and inject it into `css.named` call for multiline fixture', () => {
    const { code } = transpile(multilineFixture);
    expect(code.includes('header_')).toBeTruthy();
    expect(code).toMatchSnapshot();
    // Check if generated hash is the same
    expect(transpile(multilineFixture).code).toMatchSnapshot();
  });
});
