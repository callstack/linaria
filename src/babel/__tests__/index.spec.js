jest.mock('../extractStyles', () => ({ __esModule: true, default: jest.fn() }));

import * as babel from 'babel-core';
import path from 'path';
import extractStyles from '../extractStyles';
import dedent from 'dedent';

const transpile = source => {
  return babel.transform(source, {
    presets: ['es2015'],
    plugins: [path.resolve('src/babel/index.js')],
    babelrc: false,
  });
};

describe('babel plugin', () => {
  it('should not process tagged template if tag is not `css`', () => {
    const { code } = transpile(dedent`
    const header = \`
      font-size: 3em;
    \`;
    `);
    expect(code.includes('font-size: 3em;')).toBeTruthy();
    expect(code).toMatchSnapshot();
  });

  it('should fail if there are any unresolvable expressions in tagged template', () => {
    expect(() => {
      transpile(
        dedent(`
        const header = css\`
          font-size: \${someFn()}em;
        \`;
        `)
      );
    }).toThrowError(/Cannot resolve expression/);
  });

  it('should generate hash and inject it into `css.named` call for simple fixture', () => {
    const { code } = transpile(dedent`
    const header = css\`
      font-size: 3em;
    \`;
    `);
    expect(code.includes('header_')).toBeTruthy();
    expect(code).toMatchSnapshot();
    // Check if generated hash is the same
    expect(
      transpile(
        dedent(`
        const header = css\`
          font-size: 3em;
        \`;
        `)
      ).code
    ).toMatchSnapshot();
  });

  it('should generate hash and inject it into `css.named` call for multiline fixture', () => {
    const { code } = transpile(dedent`
    const header = css\`
      font-size: 3em;
      color: red;
      border: 1px solid #000;
    \`;
    `);
    expect(code.includes('header_')).toBeTruthy();
    expect(code).toMatchSnapshot();
    // Check if generated hash is the same
    expect(
      transpile(
        dedent(`
        const header = css\`
          font-size: 3em;
          color: red;
          border: 1px solid #000;
        \`;
        `)
      ).code
    ).toMatchSnapshot();
  });

  it('should resolve expressions and generate hash (CommonJS)', () => {
    extractStyles.mockImplementationOnce(tagExpr => {
      expect(tagExpr.quasi.expressions.length).toBe(0);
      expect(
        tagExpr.quasi.quasis[0].value.cooked.includes('font-size: 14px')
      ).toBeTruthy();
    });
    const { code } = transpile(
      dedent(`
      const constants = require('./src/babel/__tests__/__fixtures__/constants.cjs.js');

      const header = css\`
        font-size: \${constants.fontSize};
        color: black;
      \`;
      `)
    );
    expect(code).toMatchSnapshot();
  });

  it('should resolve expressions and generate hash (ESM)', () => {
    extractStyles.mockImplementationOnce(tagExpr => {
      expect(tagExpr.quasi.expressions.length).toBe(0);
      expect(
        tagExpr.quasi.quasis[0].value.cooked.includes('font-size: 14px')
      ).toBeTruthy();
    });
    const { code } = transpile(
      dedent(`
      import constants from './src/babel/__tests__/__fixtures__/constants.esm.js';

      const header = css\`
        font-size: \${constants.fontSize};
        color: black;
      \`;
      `)
    );
    expect(code).toMatchSnapshot();
  });
});
