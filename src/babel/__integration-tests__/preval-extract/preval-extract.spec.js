/* eslint-disable no-template-curly-in-string */
/* @flow */

import dedent from 'dedent';
import { transpile } from '../__utils__/exec';

describe('preval-extract babel plugin', () => {
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

  it('should create classname for "css" tagged template literal', () => {
    const { code, getCSSForClassName } = transpile(dedent`
    const header = css\`
      font-size: 3em;
    \`;
    `);

    const match = /header = \/\*.+\*\/'(_header__[a-z0-9]+)'/g.exec(code);
    expect(match).not.toBeNull();
    const css = getCSSForClassName(match[1]);
    expect(css).toMatch('font-size: 3em');
    expect(css).toMatchSnapshot();
  });

  it('should create classname for "css.named()" tagged template literal', () => {
    const { code, getCSSForClassName } = transpile(dedent`
    const header = css.named("my-header")\`
      font-size: 3em;
    \`;
    `);

    const match = /header = \/\*.+\*\/"(my-header__[a-z0-9]+)"/g.exec(code);
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

    const headerMatch = /header = \/\*.+\*\/'(_header__[a-z0-9]+)'/g.exec(code);
    const bodyMatch = /body = \/\*.+\*\/'(_body__[a-z0-9]+)'/g.exec(code);
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

    const match = /header = \/\*.+\*\/"(_header__[a-z0-9]+)"/g.exec(code);
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

    const match = /header = \/\*.+\*\/"(_header__[a-z0-9]+)"/g.exec(code);
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

    const titleMatch = /title = \/\*.+\*\/'(_title__[a-z0-9]+)'/g.exec(code);
    expect(titleMatch).not.toBeNull();

    const containerMatch = /container = \/\*.+\*\/'(_container__[a-z0-9]+)'/g.exec(
      code
    );
    expect(containerMatch).not.toBeNull();

    const css = getCSSForClassName(containerMatch[1]);
    expect(css).toMatch(titleMatch[1]);
    expect(css).toMatchSnapshot();
  });
});
