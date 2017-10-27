/* eslint-disable no-template-curly-in-string */
/* @flow */

import dedent from 'dedent';
import { transpile } from '../__utils__/exec';

describe('preval-extract babel plugin with function calls', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = '';
  });

  it('should preval with function call inside an expression', () => {
    const { code, getCSSForClassName } = transpile(dedent`
    const constants = require("./src/babel/__integration-tests__/__fixtures__/commonjs/constants.js");
    const utils = require("./src/babel/__integration-tests__/__fixtures__/commonjs/utils.js");

    const header = css\`
      font-size: ${'${utils.multiply(constants.unitless.fontSize)}'}px;
    \`;
    `);

    const match = /header = \/\*.+\*\/"(_header__[a-z0-9]+)"/g.exec(code);
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

    const match = /header = \/\*.+\*\/"(_header__[a-z0-9]+)"/g.exec(code);
    expect(match).not.toBeNull();
    const css = getCSSForClassName(match[1]);
    expect(css).toMatch('font-size: 33px');
    expect(css).toMatchSnapshot();
  });
});
