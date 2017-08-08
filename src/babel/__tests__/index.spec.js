jest.mock('../extractStyles', () => ({ __esModule: true, default: jest.fn() }));

import * as babel from 'babel-core';
import path from 'path';
import dedent from 'dedent';

function transpile(source) {
  const { code } = babel.transform(
    dedent`
      import css from './build/css';

      ${source}

      /* results */
      const results = preval\`
        import { getCache } from './build/css';
        module.exports = getCache();
      \`;
    `,
    {
      presets: ['es2015'],
      plugins: [
        path.resolve('src/babel/index.js'),
        require.resolve('babel-plugin-preval'),
      ],
      babelrc: false,
    }
  );

  const splitIndex = code.indexOf('/* results */');
  return {
    code: code.substr(0, splitIndex),
    results: eval(`${code.substr(splitIndex)}; results;`),
  };
}

function filterResults(results, match) {
  return results.find(e => e.selector.includes(match[1])) || {};
}

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

  it('should throw error if `css` tagged template literal is not assigned to a variable', () => {
    expect(() => {
      transpile(dedent`
      css\`
        font-size: 3em;
      \`;
      `);
    }).toThrow();
  });

  it('should create classname for `css` tagged template literal', () => {
    const { code, results } = transpile(dedent`
    const header = css\`
      font-size: 3em;
    \`;
    `);

    const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
    expect(match).not.toBeNull();
    const { styles } = filterResults(results, match);
    expect(styles).toMatch('font-size: 3em');
    expect(styles).toMatchSnapshot();
  });

  it('should create classnames for multiple `css` tagged template literal', () => {
    const { code, results } = transpile(dedent`
    const header = css\`
      font-size: ${'${2 + 1}'}em;
    \`;

    const body = css\`
      border-radius: ${'${2 + 2}'}px;
    \`;
    `);

    const headerMatch = /header = "(header_[a-z0-9]+)"/g.exec(code);
    const bodyMatch = /body = "(body_[a-z0-9]+)"/g.exec(code);
    expect(headerMatch).not.toBeNull();
    expect(bodyMatch).not.toBeNull();
    const { styles: headerStyles } = filterResults(results, headerMatch);
    const { styles: bodyStyles } = filterResults(results, bodyMatch);
    expect(headerStyles).toMatch('font-size: 3em');
    expect(headerStyles).toMatchSnapshot();
    expect(bodyStyles).toMatch('border-radius: 4px');
    expect(bodyStyles).toMatchSnapshot();
  });

  describe('with plain objects', () => {
    it('should preval styles with shallow object', () => {
      const { code, results } = transpile(dedent`
      const constants = {
        fontSize: '3em',
      };

      const header = css\`
        font-size: ${'${constants.fontSize}'};
      \`;
      `);

      const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const { styles } = filterResults(results, match);
      expect(styles).toMatch('font-size: 3em');
      expect(styles).toMatchSnapshot();
    });

    it('should preval styles with nested object', () => {
      const { code, results } = transpile(dedent`
      const constants = {
        header: {
          default: {
            font: {
              size: '3em',
            },
          },
        },
      };

      const header = css\`
        font-size: ${'${constants.header.default.font.size}'};
      \`;
      `);

      const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const { styles } = filterResults(results, match);
      expect(styles).toMatch('font-size: 3em');
      expect(styles).toMatchSnapshot();
    });

    it('shoyld preval styles with destructured object', () => {
      expect(() => {
        transpile(dedent`
        const { base } = {
          base: {
            font: {
              size: '3em',
            },
          },
        };

        const header = css\`
          font-size: ${'${base.font.size}'};
        \`;
        `);
      }).toThrow();

      // Uncomment once we support destructurisation
      // const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
      // expect(match).not.toBeNull();
      // const { styles } = filterResults(results, match);
      // expect(styles).toMatch('font-size: 3em');
      // expect(styles).toMatchSnapshot();
    });
  });

  describe('with commonjs imports', () => {
    it('should preval imported constants ', () => {
      const { code, results } = transpile(dedent`
      const constants = require('./src/babel/__tests__/__fixtures__/commonjs/constants.js');

      const header = css\`
        font-size: ${'${constants.fontSize}'};
      \`;
      `);

      const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const { styles } = filterResults(results, match);
      expect(styles).toMatch('font-size: 14px');
      expect(styles).toMatchSnapshot();
    });
  });
});
