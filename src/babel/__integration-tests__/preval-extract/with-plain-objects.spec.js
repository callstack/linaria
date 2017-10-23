/* eslint-disable no-template-curly-in-string */
/* @flow */

import dedent from 'dedent';
import { transpile } from '../__utils__/exec';

describe('preval-extract babel plugin with plain objects', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = '';
  });

  it('should preval styles with shallow object', () => {
    const { code, getCSSForClassName } = transpile(dedent`
    const constants = {
      fontSize: "3em",
    };

    const header = css\`
      font-size: ${'${constants.fontSize}'};
    \`;
    `);

    const match = /header = \/\*.+\*\/"(_header__[a-z0-9]+)"/g.exec(code);
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

    const match = /header = \/\*.+\*\/"(_header__[a-z0-9]+)"/g.exec(code);
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

    const match = /header = \/\*.+\*\/"(_header__[a-z0-9]+)"/g.exec(code);
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

    const match = /header = \/\*.+\*\/"(_header__[a-z0-9]+)"/g.exec(code);
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

    const match = /header = \/\*.+\*\/"(_header__[a-z0-9]+)"/g.exec(code);
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

    const match = /header = \/\*.+\*\/"(_header__[a-z0-9]+)"/g.exec(code);
    expect(match).not.toBeNull();
    const css = getCSSForClassName(match[1]);
    expect(css).toMatch('font-size: 3em');
    expect(css).toMatchSnapshot();
  });
});
