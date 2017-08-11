/* eslint-disable no-template-curly-in-string */
/* @flow */

import * as babel from 'babel-core';
import path from 'path';
import dedent from 'dedent';
import extractStyles from '../extractStyles';

jest.mock('../extractStyles', () => ({ __esModule: true, default: jest.fn() }));

function transpile(source, pluginOptions = {}, options = {}) {
  const { code } = babel.transform(
    dedent`
      import css from './src/css';

      ${source}

      /* results */
      const results = preval\`
        require('babel-register');
        require('babel-polyfill');
        const sheet = require('./src/sheet').default;
        module.exports = sheet.styles();
      \`;
    `,
    {
      presets: ['es2015'],
      plugins: [
        [path.resolve('src/babel/index.js'), pluginOptions],
        require.resolve('babel-plugin-preval'),
      ],
      babelrc: false,
      ...options,
    }
  );

  const splitIndex = code.indexOf('/* results */');
  return {
    code: code.substr(0, splitIndex),
    results: eval(`${code.substr(splitIndex)}; results;`), // eslint-disable-line no-eval
  };
}

function filterResults(results, match) {
  return results.find(e => e.selector.includes(match[1])) || {};
}

describe('babel plugin', () => {
  beforeEach(() => {
    /* $FlowFixMe */
    extractStyles.mockReset();
  });

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

  it('should throw error if `css.named` is not called with classname', () => {
    expect(() => {
      transpile(dedent`
      css.named\`
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
    const { css } = filterResults(results, match);
    expect(css).toMatch('font-size: 3em');
    expect(css).toMatchSnapshot();
  });

  it('should create classname for `css.named()` tagged template literal', () => {
    const { code, results } = transpile(dedent`
    const header = css.named('my-header')\`
      font-size: 3em;
    \`;
    `);

    const match = /header = "(my-header_[a-z0-9]+)"/g.exec(code);
    expect(match).not.toBeNull();
    const { css } = filterResults(results, match);
    expect(css).toMatch('font-size: 3em');
    expect(css).toMatchSnapshot();
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
    const { css: headerStyles } = filterResults(results, headerMatch);
    const { css: bodyStyles } = filterResults(results, bodyMatch);
    expect(headerStyles).toMatch('font-size: 3em');
    expect(headerStyles).toMatchSnapshot();
    expect(bodyStyles).toMatch('border-radius: 4px');
    expect(bodyStyles).toMatchSnapshot();
  });

  it('should create classname for non-top-level `css` tagged template literal', () => {
    const { code, results } = transpile(dedent`
    const defaults = {
      fontSize: '3em',
    };

    function render() {
      const header = css\`
        font-size: ${'${defaults.fontSize}'};
      \`;
    }
    `);

    const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
    expect(match).not.toBeNull();
    const { css } = filterResults(results, match);
    expect(css).toMatch('font-size: 3em');
    expect(css).toMatchSnapshot();
  });

  it('should preval const and let without transpilation to var', () => {
    const { code, results } = transpile(
      dedent`
      const size = 3;
      let color = '#ffffff';

      const header = css\`
        font-size: ${'${size}'}em;
        color: ${'${color}'};
      \`;
      `,
      {},
      { presets: [] }
    );

    const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
    expect(match).not.toBeNull();
    const { css } = filterResults(results, match);
    expect(css).toMatch('font-size: 3em');
    expect(css).toMatch('color: #ffffff');
    expect(css).toMatchSnapshot();
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
      const { css } = filterResults(results, match);
      expect(css).toMatch('font-size: 3em');
      expect(css).toMatchSnapshot();
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
      const { css } = filterResults(results, match);
      expect(css).toMatch('font-size: 3em');
      expect(css).toMatchSnapshot();
    });

    it('should preval styles with shallowly destructurized object', () => {
      const { code, results } = transpile(dedent`
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

      const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const { css } = filterResults(results, match);
      expect(css).toMatch('font-size: 3em');
      expect(css).toMatchSnapshot();
    });

    it('should preval styles with deeply destructurized object', () => {
      const { code, results } = transpile(dedent`
      const { base: { font: { size } } } = {
        base: {
          font: {
            size: '3em',
          },
        },
      };

      const header = css\`
        font-size: ${'${size}'};
      \`;
      `);

      const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const { css } = filterResults(results, match);
      expect(css).toMatch('font-size: 3em');
      expect(css).toMatchSnapshot();
    });

    it('should preval styles with deeply destructurized object and aliases', () => {
      const { code, results } = transpile(dedent`
      const { base: { font: { size: baseFontSize } } } = {
        base: {
          font: {
            size: '3em',
          },
        },
      };

      const header = css\`
        font-size: ${'${baseFontSize}'};
      \`;
      `);

      const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const { css } = filterResults(results, match);
      expect(css).toMatch('font-size: 3em');
      expect(css).toMatchSnapshot();
    });

    it('should preval styles with deeply destructurized object, aliases and defaults', () => {
      const { code, results } = transpile(dedent`
      const { base: { font: { size: baseFontSize = '3em' } } } = {
        base: {
          font: {},
        },
      };

      const header = css\`
        font-size: ${'${baseFontSize}'};
      \`;
      `);

      const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const { css } = filterResults(results, match);
      expect(css).toMatch('font-size: 3em');
      expect(css).toMatchSnapshot();
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
      const { css } = filterResults(results, match);
      expect(css).toMatch('font-size: 14px');
      expect(css).toMatchSnapshot();
    });

    it('should preval imported constants with destructurization', () => {
      const { code, results } = transpile(dedent`
      const { fontSize } = require('./src/babel/__tests__/__fixtures__/commonjs/constants.js');

      const header = css\`
        font-size: ${'${fontSize}'};
      \`;
      `);

      const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const { css } = filterResults(results, match);
      expect(css).toMatch('font-size: 14px');
      expect(css).toMatchSnapshot();
    });
  });

  describe('with commonjs imports', () => {
    it('should preval default export', () => {
      const { code, results } = transpile(dedent`
      import constants from './src/babel/__tests__/__fixtures__/esm/constants.js';

      const header = css\`
        font-size: ${'${constants.fontSize}'};
      \`;
      `);

      const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const { css } = filterResults(results, match);
      expect(css).toMatch('font-size: 14px');
      expect(css).toMatchSnapshot();
    });

    it('should preval named imports', () => {
      const { code, results } = transpile(dedent`
      import { base, primary } from './src/babel/__tests__/__fixtures__/esm/named.js';

      const header = css\`
        font-size: ${'${primary.fontSize}'};
      \`;

      const body = css\`
        font-size: ${'${base.fontSize}'};
      \`;
      `);

      const headerMatch = /header = "(header_[a-z0-9]+)"/g.exec(code);
      const bodyMatch = /body = "(body_[a-z0-9]+)"/g.exec(code);
      expect(headerMatch).not.toBeNull();
      expect(bodyMatch).not.toBeNull();
      const { css: headerStyles } = filterResults(results, headerMatch);
      const { css: bodyStyles } = filterResults(results, bodyMatch);
      expect(headerStyles).toMatch('font-size: 36px');
      expect(headerStyles).toMatchSnapshot();
      expect(bodyStyles).toMatch('font-size: 24px');
      expect(bodyStyles).toMatchSnapshot();
    });

    it('should preval imported module tree with constants', () => {
      const { code, results } = transpile(dedent`
      import constants from './src/babel/__tests__/__fixtures__/esm/deep.js';

      const header = css\`
        font-size: ${'${constants.fontSize}'};
      \`;
      `);

      const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const { css } = filterResults(results, match);
      expect(css).toMatch('font-size: 28px');
      expect(css).toMatchSnapshot();
    });
  });

  describe('with function delcarations/expressions', () => {
    it('should preval with function declaration', () => {
      const { code, results } = transpile(dedent`
      function getConstants() {
        return {
          fontSize: '14px',
        };
      }

      const header = css\`
        font-size: ${'${getConstants().fontSize}'};
      \`;
      `);

      const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const { css } = filterResults(results, match);
      expect(css).toMatch('font-size: 14px');
      expect(css).toMatchSnapshot();
    });

    it('should preval with function expression', () => {
      const { code, results } = transpile(dedent`
      const getConstants = function getConstants() {
        return {
          fontSize: '14px',
        };
      }

      const header = css\`
        font-size: ${'${getConstants().fontSize}'};
      \`;
      `);

      const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const { css } = filterResults(results, match);
      expect(css).toMatch('font-size: 14px');
      expect(css).toMatchSnapshot();
    });

    it('should preval with arrow function', () => {
      const { code, results } = transpile(dedent`
      const getConstants = () => ({
        fontSize: '14px',
      });

      const header = css\`
        font-size: ${'${getConstants().fontSize}'};
      \`;
      `);

      const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const { css } = filterResults(results, match);
      expect(css).toMatch('font-size: 14px');
      expect(css).toMatchSnapshot();
    });

    it('should preval function with external ids', () => {
      const { code, results } = transpile(dedent`
      const defaults = { fontSize: '14px' };
      const getConstants = () => Object.assign({}, defaults);

      const header = css\`
        font-size: ${'${getConstants().fontSize}'};
      \`;
      `);

      const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const { css } = filterResults(results, match);
      expect(css).toMatch('font-size: 14px');
      expect(css).toMatchSnapshot();
    });
  });

  describe('with function calls', () => {
    it('should preval with function call inside an expression', () => {
      const { code, results } = transpile(dedent`
      const constants = require('./src/babel/__tests__/__fixtures__/commonjs/constants.js');
      const utils = require('./src/babel/__tests__/__fixtures__/commonjs/utils.js');

      const header = css\`
        font-size: ${'${utils.multiply(constants.unitless.fontSize)}'}px;
      \`;
      `);

      const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const { css } = filterResults(results, match);
      expect(css).toMatch('font-size: 28px');
      expect(css).toMatchSnapshot();
    });

    it('should preval multiple function calls inside an expression', () => {
      const { code, results } = transpile(dedent`
      const constants = require('./src/babel/__tests__/__fixtures__/commonjs/constants.js');
      const utils = require('./src/babel/__tests__/__fixtures__/commonjs/utils.js');

      function compose(...fns) {
        return value => fns.reduce((prev, fn) => {
          return fn(prev);
        }, value);
      }

      const header = css\`
        font-size: ${'${compose(utils.multiply, utils.add5)(constants.unitless.fontSize)}'}px;
      \`;
      `);

      const match = /header = "(header_[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const { css } = filterResults(results, match);
      expect(css).toMatch('font-size: 33px');
      expect(css).toMatchSnapshot();
    });
  });

  describe('with extraction enabled', () => {
    const write = jest.fn();
    const append = jest.fn();

    beforeEach(() => {
      /* $FlowFixMe */
      const Module = require('module'); // eslint-disable-line global-require
      const sheetModule = Module._cache[require.resolve('../../sheet.js')];
      sheetModule.exports.default.dump();

      write.mockClear();
      append.mockClear();

      /* $FlowFixMe */
      extractStyles.mockImplementation((t, p, f, o) => {
        const filename = require.resolve('../extractStyles.js');
        const m = new Module(filename, module.parent);
        m.filename = filename;
        m.paths = Module._nodeModulePaths(path.dirname(filename));
        m._compile(
          `require("${require.resolve('../register')}");
          ${babel.transformFileSync(filename).code}`,
          filename
        );

        m.children.push(sheetModule);

        return m.exports.default(t, p, f, o, {
          appendFileSync: append,
          writeFileSync: write,
        });
      });
    });

    it('should extract all styles to a single file', () => {
      const filename = path.join(process.cwd(), 'test.js');
      transpile(
        dedent`
        const header = css\`
          font-size: 3em;
        \`;
        `,
        { single: true },
        { filename }
      );

      transpile(
        dedent`
        const body = css\`
          font-weight: bold;
        \`;
        `,
        { single: true },
        { filename }
      );
      expect(write).not.toHaveBeenCalled();
      expect(append).toHaveBeenCalledTimes(2);
      expect(append.mock.calls.map(call => call[1])).toMatchSnapshot();
    });

    it('should extract each style to separate file and include it into source file', () => {
      const filename1 = path.join(process.cwd(), 'test1.js');
      const filename2 = path.join(process.cwd(), 'test2.js');

      const { code: code1 } = transpile(
        dedent`
        const header = css\`
          font-size: 3em;
        \`;
        `,
        {},
        { filename: filename1 }
      );

      const { code: code2 } = transpile(
        dedent`
        const body = css\`
          font-weight: bold;
        \`;
        `,
        {},
        { filename: filename2 }
      );

      expect(
        code1.includes(`require('${filename1.replace('js', 'css')}')`)
      ).toBeTruthy();
      expect(
        code2.includes(`require('${filename2.replace('js', 'css')}')`)
      ).toBeTruthy();

      expect(append).not.toHaveBeenCalled();
      expect(write).toHaveBeenCalledTimes(2);
      expect(write.mock.calls.map(call => call[1])).toMatchSnapshot();
      expect(write.mock.calls[0][0]).toEqual(filename1.replace('js', 'css'));
      expect(write.mock.calls[1][0]).toEqual(filename2.replace('js', 'css'));
    });

    it('extract styles to a given file', () => {
      const filename = path.join(process.cwd(), 'test.js');
      transpile(
        dedent`
        const header = css\`
          font-size: 3em;
        \`;
        `,
        { single: true, filename: '[name]-static.css' },
        { filename }
      );

      expect(write).not.toHaveBeenCalled();
      expect(append).toHaveBeenCalledTimes(1);
      expect(append.mock.calls[0][0]).toEqual(
        path.join(path.dirname(filename), 'test-static.css')
      );
    });

    it('extract styles to a given file with output directry specified', () => {
      const filename = path.join(process.cwd(), 'test.js');
      transpile(
        dedent`
        const header = css\`
          font-size: 3em;
        \`;
        `,
        { single: true, filename: '[name]-static.css', outDir: 'output' },
        { filename }
      );

      expect(write).not.toHaveBeenCalled();
      expect(append).toHaveBeenCalledTimes(1);
      expect(append.mock.calls[0][0]).toEqual(
        path.join(path.dirname(filename), 'output', 'test-static.css')
      );
    });
  });
});
