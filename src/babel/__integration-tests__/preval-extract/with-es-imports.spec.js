/* eslint-disable no-template-curly-in-string */
/* @flow */

import dedent from 'dedent';
import { transpile } from '../__utils__/exec';

describe('preval-extract babel plugin with ES imports', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = '';
  });

  it('should preval default export', () => {
    const { code, getCSSForClassName } = transpile(dedent`
      import constants from "./src/babel/__integration-tests__/__fixtures__/esm/constants.js";

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

    const headerMatch = /header = \/\*.+\*\/"(_header__[a-z0-9]+)"/g.exec(code);
    const bodyMatch = /body = \/\*.+\*\/"(_body__[a-z0-9]+)"/g.exec(code);
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

    const match = /header = \/\*.+\*\/"(_header__[a-z0-9]+)"/g.exec(code);
    expect(match).not.toBeNull();
    const css = getCSSForClassName(match[1]);
    expect(css).toMatch('font-size: 28px');
    expect(css).toMatchSnapshot();
  });
});
