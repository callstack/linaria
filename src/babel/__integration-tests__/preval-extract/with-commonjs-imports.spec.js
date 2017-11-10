/* eslint-disable no-template-curly-in-string */
/* @flow */

import dedent from 'dedent';
import { transpile } from '../__utils__/exec';

describe('preval-extract babel plugin with commonjs imports', () => {
  it('should preval imported constants ', () => {
    const { code, getCSSForClassName } = transpile(dedent`
    const constants = require("./src/babel/__integration-tests__/__fixtures__/commonjs/constants.js");

    const header = css\`
      font-size: ${'${constants.fontSize}'};
    \`;
    `);

    const match = /header = \/\*.+\*\/"(_header__[a-z0-9]+)"/g.exec(code);
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

    const match = /header = \/\*.+\*\/"(_header__[a-z0-9]+)"/g.exec(code);
    expect(match).not.toBeNull();
    const css = getCSSForClassName(match[1]);
    expect(css).toMatch('font-size: 14px');
    expect(css).toMatchSnapshot();
  });
});
