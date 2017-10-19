/* eslint-disable no-template-curly-in-string */
/* @flow */

import dedent from 'dedent';
import { transpile } from '../__utils__/exec';

describe('with object and jsx properties', () => {
  it('should preval with object properties', () => {
    const { code, getCSSForClassName } = transpile(dedent`
      const styles = {
        header: css\`
          font-size: 3em;
        \`,
      };
      `);

    const match = /header: \/\*.+\*\/'(_header__[a-z0-9]+)'/g.exec(code);
    expect(match).not.toBeNull();
    const css = getCSSForClassName(match[1]);
    expect(css).toMatch('font-size: 3em');
  });

  it('should preval with JSX props', () => {
    const { code, getCSSForClassName } = transpile(dedent`
      <article className={css\`font-size: 3em\`} />
      `);

    const match = /className: \/\*.+\*\/'(_article__[a-z0-9]+)'/g.exec(code);
    expect(match).not.toBeNull();
    const css = getCSSForClassName(match[1]);
    expect(css).toMatch('font-size: 3em');
  });

  it('should preval with spreading in JSX', () => {
    const { code, getCSSForClassName } = transpile(dedent`
      <article {...styles(css\`font-size: 3em\`)} />
      `);

    const match = /styles\( \/\*.+\*\/'(_article__[a-z0-9]+)'\)/g.exec(code);
    expect(match).not.toBeNull();
    const css = getCSSForClassName(match[1]);
    expect(css).toMatch('font-size: 3em');
  });
});
