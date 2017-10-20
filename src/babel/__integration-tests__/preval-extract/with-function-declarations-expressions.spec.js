/* eslint-disable no-template-curly-in-string */
/* @flow */

import dedent from 'dedent';
import { transpile } from '../__utils__/exec';

describe('preval-extract babel plugin with function delcarations/expressions', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = '';
  });

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
