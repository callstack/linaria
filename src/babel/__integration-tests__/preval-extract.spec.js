/* eslint-disable no-template-curly-in-string */
/* eslint-env jest */
/* @flow */

import path from 'path';
import dedent from 'dedent';
// eslint-disable-next-line import/no-extraneous-dependencies
import stripAnsi from 'strip-ansi';
// eslint-disable-next-line import/no-extraneous-dependencies
import escapeStringRegexp from 'escape-string-regexp';

import { transpile, extract } from './__utils__/exec';

const serialize = val =>
  stripAnsi(
    val
      .toString()
      .replace(
        new RegExp(escapeStringRegexp(process.cwd()), 'gm'),
        '<<REPLACED>>'
      )
  );

// $FlowFixMe
expect.addSnapshotSerializer({
  test: val => val && val.toString && val.toString().includes(process.cwd()),
  serialize,
  print: serialize,
});

describe('preval-extract babel plugin', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = '';
  });

  it('should not process tagged template if tag is not "css"', () => {
    const { code } = transpile(dedent`
    const header = \`
      font-size: 3em;
    \`;
    `);
    expect(code).toMatch('font-size: 3em;');
    expect(code).toMatchSnapshot();
  });

  it('should not process file if it has "linaria-preval" comment', () => {
    const { code } = transpile(dedent`
    /* linaria-preval */
    const header = css\`
      font-size: ${'${2 + 1}'}em;
    \`;
    `);
    expect(code).not.toMatch('font-size: 3em;');

    const { code: codeAlt } = transpile(dedent`
    const header = css\`
      font-size: ${'${2 + 1}'}em;
    \`;
    /* linaria-preval */
    `);
    expect(codeAlt).not.toMatch('font-size: 3em;');
  });

  it('should throw error if "css" tagged template literal is not assigned to a variable', () => {
    expect(() => {
      transpile(dedent`
      css\`
        font-size: 3em;
      \`;
      `);
    }).toThrow();
  });

  it('should throw error if "css.named" is not called with classname', () => {
    expect(() => {
      transpile(dedent`
      css.named\`
        font-size: 3em;
      \`;
      `);
    }).toThrow();
  });

  it('should throw error if the id was not found', () => {
    expect(() => {
      transpile(dedent`
      const title = css\`
        width: ${'${document.width}'};
      \`;
      `);
    }).toThrowErrorMatchingSnapshot();
  });

  it('should build valid code frame for errors while evaling styles', () => {
    expect(() => {
      transpile(dedent`
      const test = () => {
        throw new Error("Some weird error");
      };

      function m() {
        test();
      }

      const header = css\`color: ${'${m()}'};\`;
      `);
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
      transpile(dedent`
      const utils = require("./src/babel/__integration-tests__/__fixtures__/commonjs/utils.js");

      const header = css\`color: ${'${utils.throw()}'};\`;
      `);
    }).toThrowErrorMatchingSnapshot();
  });

  it('should create classname for "css" tagged template literal', () => {
    const { code, getCSSForClassName } = transpile(dedent`
    const header = css\`
      font-size: 3em;
    \`;
    `);

    const match = /header = '(header__[a-z0-9]+)'/g.exec(code);
    expect(match).not.toBeNull();
    const css = getCSSForClassName(match[1]);
    expect(css).toMatch('font-size: 3em');
    expect(css).toMatchSnapshot();
  });

  it('in development should use filename for slug creation', () => {
    process.env.BABEL_ENV = '';
    const { code: codeWithSlugFromContent } = transpile(dedent`
    const header = css\`
      font-size: 3em;
    \`;
    `);

    process.env.BABEL_ENV = 'production';
    const { code: codeWithSlugFromFilename } = transpile(
      dedent`
      const header = css\`
        font-size: 3em;
      \`;
      `,
      undefined,
      { filename: path.join(process.cwd(), 'test.js') }
    );

    const classnameWithSlugFromContent = /header = '(header__[a-z0-9]+)'/g.exec(
      codeWithSlugFromContent
    );
    const classnameWithSlugFromFilename = /header = '(header__[a-z0-9]+)'/g.exec(
      codeWithSlugFromFilename
    );

    expect(classnameWithSlugFromContent).not.toBeNull();
    expect(classnameWithSlugFromFilename).not.toBeNull();
    expect(classnameWithSlugFromContent[0]).not.toEqual(
      codeWithSlugFromFilename[0]
    );
  });

  it('should create classname for "css.named()" tagged template literal', () => {
    const { code, getCSSForClassName } = transpile(dedent`
    const header = css.named("my-header")\`
      font-size: 3em;
    \`;
    `);

    const match = /header = "(my-header__[a-z0-9]+)"/g.exec(code);
    expect(match).not.toBeNull();
    const css = getCSSForClassName(match[1]);
    expect(css).toMatch('font-size: 3em');
    expect(css).toMatchSnapshot();
  });

  it('should create classnames for multiple "css" tagged template literal', () => {
    const { code, getCSSForClassName } = transpile(dedent`
    const header = css\`
      font-size: ${'${2 + 1}'}em;
    \`;

    const body = css\`
      border-radius: ${'${2 + 2}'}px;
    \`;
    `);

    const headerMatch = /header = '(header__[a-z0-9]+)'/g.exec(code);
    const bodyMatch = /body = '(body__[a-z0-9]+)'/g.exec(code);
    expect(headerMatch).not.toBeNull();
    expect(bodyMatch).not.toBeNull();
    const headerStyles = getCSSForClassName(headerMatch[1]);
    const bodyStyles = getCSSForClassName(bodyMatch[1]);
    expect(headerStyles).toMatch('font-size: 3em');
    expect(headerStyles).toMatchSnapshot();
    expect(bodyStyles).toMatch('border-radius: 4px');
    expect(bodyStyles).toMatchSnapshot();
  });

  it('should create classname for non-top-level "css" tagged template literal', () => {
    const { code, getCSSForClassName } = transpile(dedent`
    const defaults = {
      fontSize: "3em",
    };

    function render() {
      const header = css\`
        font-size: ${'${defaults.fontSize}'};
      \`;
    }
    `);

    const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
    expect(match).not.toBeNull();
    const css = getCSSForClassName(match[1]);
    expect(css).toMatch('font-size: 3em');
    expect(css).toMatchSnapshot();
  });

  it('should preval const and let without transpilation to var', () => {
    const { code, getCSSForClassName } = transpile(
      dedent`
      const size = 3;
      let color = "#ffffff";

      const header = css\`
        font-size: ${'${size}'}em;
        color: ${'${color}'};
      \`;
      `,
      undefined,
      {
        presets: ['stage-2'],
        filename: 'test.js',
        babelrc: false,
      }
    );

    const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
    expect(match).not.toBeNull();
    const css = getCSSForClassName(match[1]);
    expect(css).toMatch('font-size: 3em');
    expect(css).toMatch('color: #ffffff');
    expect(code).toMatchSnapshot();
  });

  it('should preval css with classname from another prevaled css', () => {
    const { code, getCSSForClassName } = transpile(dedent`
    const title = css\`
    color: blue;
    \`;

    const container = css\`
    padding: 2rem;

    .${'${title}'} {
      margin-bottom: 1rem;
    }
    \`;
    `);

    const titleMatch = /title = '(title__[a-z0-9]+)'/g.exec(code);
    expect(titleMatch).not.toBeNull();

    const containerMatch = /container = '(container__[a-z0-9]+)'/g.exec(code);
    expect(containerMatch).not.toBeNull();

    const css = getCSSForClassName(containerMatch[1]);
    expect(css).toMatch(titleMatch[1]);
    expect(css).toMatchSnapshot();
  });

  describe('with plain objects', () => {
    it('should preval styles with shallow object', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      const constants = {
        fontSize: "3em",
      };

      const header = css\`
        font-size: ${'${constants.fontSize}'};
      \`;
      `);

      const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const css = getCSSForClassName(match[1]);
      expect(css).toMatch('font-size: 3em');
      expect(css).toMatchSnapshot();
    });

    it('should preval styles with nested object', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      const constants = {
        header: {
          default: {
            font: {
              size: "3em",
            },
          },
        },
      };

      const header = css\`
        font-size: ${'${constants.header.default.font.size}'};
      \`;
      `);

      const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const css = getCSSForClassName(match[1]);
      expect(css).toMatch('font-size: 3em');
      expect(css).toMatchSnapshot();
    });

    it('should preval styles with shallowly destructurized object', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      const { base } = {
        base: {
          font: {
            size: "3em",
          },
        },
      };

      const header = css\`
        font-size: ${'${base.font.size}'};
      \`;
      `);

      const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const css = getCSSForClassName(match[1]);
      expect(css).toMatch('font-size: 3em');
      expect(css).toMatchSnapshot();
    });

    it('should preval styles with deeply destructurized object', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      const { base: { font: { size } } } = {
        base: {
          font: {
            size: "3em",
          },
        },
      };

      const header = css\`
        font-size: ${'${size}'};
      \`;
      `);

      const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const css = getCSSForClassName(match[1]);
      expect(css).toMatch('font-size: 3em');
      expect(css).toMatchSnapshot();
    });

    it('should preval styles with deeply destructurized object and aliases', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      const { base: { font: { size: baseFontSize } } } = {
        base: {
          font: {
            size: "3em",
          },
        },
      };

      const header = css\`
        font-size: ${'${baseFontSize}'};
      \`;
      `);

      const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const css = getCSSForClassName(match[1]);
      expect(css).toMatch('font-size: 3em');
      expect(css).toMatchSnapshot();
    });

    it('should preval styles with deeply destructurized object, aliases and defaults', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      const { base: { font: { size: baseFontSize = "3em" } } } = {
        base: {
          font: {},
        },
      };

      const header = css\`
        font-size: ${'${baseFontSize}'};
      \`;
      `);

      const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const css = getCSSForClassName(match[1]);
      expect(css).toMatch('font-size: 3em');
      expect(css).toMatchSnapshot();
    });
  });

  describe('with commonjs imports', () => {
    it('should preval imported constants ', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      const constants = require("./src/babel/__integration-tests__/__fixtures__/commonjs/constants.js");

      const header = css\`
        font-size: ${'${constants.fontSize}'};
      \`;
      `);

      const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const css = getCSSForClassName(match[1]);
      expect(css).toMatch('font-size: 14px');
      expect(css).toMatchSnapshot();
    });

    it('should preval imported constants with destructurization', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      const { fontSize } = require("./src/babel/__integration-tests__/__fixtures__/commonjs/constants.js");

      const header = css\`
        font-size: ${'${fontSize}'};
      \`;
      `);

      const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const css = getCSSForClassName(match[1]);
      expect(css).toMatch('font-size: 14px');
      expect(css).toMatchSnapshot();
    });
  });

  describe('with ES imports', () => {
    it('should preval default export', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      import constants from "./src/babel/__integration-tests__/__fixtures__/esm/constants.js";

      const header = css\`
        font-size: ${'${constants.fontSize}'};
      \`;
      `);

      const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const css = getCSSForClassName(match[1]);
      expect(css).toMatch('font-size: 14px');
      expect(css).toMatchSnapshot();
    });

    it('should preval named imports', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      import { base, primary } from "./src/babel/__integration-tests__/__fixtures__/esm/named.js";

      const header = css\`
        font-size: ${'${primary.fontSize}'};
      \`;

      const body = css\`
        font-size: ${'${base.fontSize}'};
      \`;
      `);

      const headerMatch = /header = "(header__[a-z0-9]+)"/g.exec(code);
      const bodyMatch = /body = "(body__[a-z0-9]+)"/g.exec(code);
      expect(headerMatch).not.toBeNull();
      expect(bodyMatch).not.toBeNull();
      const headerStyles = getCSSForClassName(headerMatch[1]);
      const bodyStyles = getCSSForClassName(bodyMatch[1]);
      expect(headerStyles).toMatch('font-size: 36px');
      expect(headerStyles).toMatchSnapshot();
      expect(bodyStyles).toMatch('font-size: 24px');
      expect(bodyStyles).toMatchSnapshot();
    });

    it('should preval imported module tree with constants', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      import constants from "./src/babel/__integration-tests__/__fixtures__/esm/deep.js";

      const header = css\`
        font-size: ${'${constants.fontSize}'};
      \`;
      `);

      const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const css = getCSSForClassName(match[1]);
      expect(css).toMatch('font-size: 28px');
      expect(css).toMatchSnapshot();
    });
  });

  describe('with function delcarations/expressions', () => {
    it('should preval with function declaration', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      function getConstants() {
        return {
          fontSize: "14px",
        };
      }

      const header = css\`
        font-size: ${'${getConstants().fontSize}'};
      \`;
      `);

      const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const css = getCSSForClassName(match[1]);
      expect(css).toMatch('font-size: 14px');
      expect(css).toMatchSnapshot();
    });

    it('should preval with function expression', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      const getConstants = function getConstants() {
        return {
          fontSize: "14px",
        };
      }

      const header = css\`
        font-size: ${'${getConstants().fontSize}'};
      \`;
      `);

      const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const css = getCSSForClassName(match[1]);
      expect(css).toMatch('font-size: 14px');
      expect(css).toMatchSnapshot();
    });

    it('should preval with arrow function', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      const getConstants = () => ({
        fontSize: "14px",
      });

      const header = css\`
        font-size: ${'${getConstants().fontSize}'};
      \`;
      `);

      const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const css = getCSSForClassName(match[1]);
      expect(css).toMatch('font-size: 14px');
      expect(css).toMatchSnapshot();
    });

    it('should preval function with flat/shallow external ids', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      const defaults = { fontSize: "14px" };
      const getConstants = () => Object.assign({}, defaults);

      const header = css\`
        font-size: ${'${getConstants().fontSize}'};
      \`;
      `);

      const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const css = getCSSForClassName(match[1]);
      expect(css).toMatch('font-size: 14px');
      expect(css).toMatchSnapshot();
    });

    it('should preval function with nested/deep external ids', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      const base = { color: "#ffffff", fontSize: "15px" };
      const defaults = { fontSize: "14px", ...base };
      const getConstants = () => ({ ...defaults });

      const header = css\`
        font-size: ${'${getConstants().fontSize}'};
      \`;
      `);

      const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const css = getCSSForClassName(match[1]);
      expect(css).toMatch('font-size: 15px');
      expect(css).toMatchSnapshot();
    });

    it('should preval function with multiple nested/deep external ids', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      function multiply(value, by) {
        return value * by;
      }

      const bg = { background: "none" };
      const base = { color: "#ffffff", fontSize: multiply(14, 2) + "px", ...bg };
      const defaults = { fontSize: "14px", ...base, ...bg };
      const getConstants = () => ({ ...defaults });

      const header = css\`
        font-size: ${'${getConstants().fontSize}'};
      \`;
      `);

      const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const css = getCSSForClassName(match[1]);
      expect(css).toMatch('font-size: 28px');
      expect(css).toMatchSnapshot();
    });
  });

  describe('with function calls', () => {
    it('should preval with function call inside an expression', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      const constants = require("./src/babel/__integration-tests__/__fixtures__/commonjs/constants.js");
      const utils = require("./src/babel/__integration-tests__/__fixtures__/commonjs/utils.js");

      const header = css\`
        font-size: ${'${utils.multiply(constants.unitless.fontSize)}'}px;
      \`;
      `);

      const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const css = getCSSForClassName(match[1]);
      expect(css).toMatch('font-size: 28px');
      expect(css).toMatchSnapshot();
    });

    it('should preval multiple function calls inside an expression', () => {
      const { code, getCSSForClassName } = transpile(dedent`
      const constants = require("./src/babel/__integration-tests__/__fixtures__/commonjs/constants.js");
      const utils = require("./src/babel/__integration-tests__/__fixtures__/commonjs/utils.js");

      function compose(...fns) {
        return value => fns.reduce((prev, fn) => {
          return fn(prev);
        }, value);
      }

      const header = css\`
        font-size: ${'${compose(utils.multiply, utils.add5)(constants.unitless.fontSize)}'}px;
      \`;
      `);

      const match = /header = "(header__[a-z0-9]+)"/g.exec(code);
      expect(match).not.toBeNull();
      const css = getCSSForClassName(match[1]);
      expect(css).toMatch('font-size: 33px');
      expect(css).toMatchSnapshot();
    });
  });

  describe('with extraction enabled', () => {
    it('should extract all styles to a single file', () => {
      const filename = path.join(process.cwd(), 'test.js');
      const { data: data1, filenames: filenames1 } = extract(
        dedent`
        const header = css\`
          font-size: 3em;
        \`;
        `,
        { single: true },
        { filename }
      );

      const { data: data2, filenames: filenames2 } = extract(
        dedent`
        const body = css\`
          font-weight: bold;
        \`;
        `,
        { single: true },
        { filename }
      );

      expect(filenames1).toEqual(filenames2);
      expect(data1).toMatchSnapshot();
      expect(data2).toMatchSnapshot();
    });

    it('should extract each style to separate file and include it into source file', () => {
      const filename1 = path.join(process.cwd(), 'test1.js');
      const filename2 = path.join(process.cwd(), 'test2.js');

      const {
        data: data1,
        filenames: filenames1,
        transpiled: transpiled1,
      } = extract(
        dedent`
        const header = css\`
          font-size: 3em;
        \`;
        `,
        undefined,
        { filename: filename1 }
      );

      const {
        data: data2,
        filenames: filenames2,
        transpiled: transpiled2,
      } = extract(
        dedent`
        const body = css\`
          font-weight: bold;
        \`;
        `,
        undefined,
        { filename: filename2 }
      );

      expect(transpiled1).toMatch(
        `require('${filename1.replace('js', 'css')}')`
      );
      expect(transpiled2).toMatch(
        `require('${filename2.replace('js', 'css')}')`
      );

      expect(data1).toMatchSnapshot();
      expect(data2).toMatchSnapshot();
      expect(filenames1).toEqual([filename1.replace('js', 'css')]);
      expect(filenames2).toEqual([filename2.replace('js', 'css')]);
    });

    it('extract styles to a given file', () => {
      const filename = path.join(process.cwd(), 'test.js');
      const { data, filenames } = extract(
        dedent`
        const header = css\`
          font-size: 3em;
        \`;
        `,
        { single: true, filename: '[name]-static.css', cache: false },
        { filename }
      );

      expect(filenames).toEqual([
        path.join(path.dirname(filename), 'test-static.css'),
      ]);
      expect(data).toMatchSnapshot();
    });

    it('extract styles to a given file with output directory specified', () => {
      const filename = path.join(process.cwd(), 'test.js');
      const { data, filenames } = extract(
        dedent`
        const header = css\`
          font-size: 3em;
        \`;
        `,
        {
          single: true,
          filename: '[name]-static.css',
          outDir: 'output',
          cache: false,
        },
        { filename }
      );

      expect(filenames).toEqual([
        path.join(path.dirname(filename), 'output', 'test-static.css'),
      ]);
      expect(data).toMatchSnapshot();
    });
  });
});
