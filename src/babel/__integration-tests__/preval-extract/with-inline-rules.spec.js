/* eslint-disable no-template-curly-in-string */
/* @flow */

import dedent from 'dedent';
import { transpile } from '../__utils__/exec';

function assertAndCheckForDuplications(
  { code, getCSSForClassName },
  regex,
  count,
  stylesToMatch
) {
  const classNames = [];
  for (let i = 0; i < count; i++) {
    const match = regex.exec(code);

    expect(match).not.toBeNull();
    expect(classNames.indexOf(match[1])).toBe(-1);

    classNames.push(match[1]);

    const css = getCSSForClassName(match[1]);
    expect(css).toMatch(stylesToMatch);
  }
}

describe('with inline rules', () => {
  it('should preval inside function call assigned to variable', () => {
    const { code, getCSSForClassName } = transpile(dedent`
      const header = styled('div', css\`
        font-size: 3em;
      \`);
      `);

    const match = /header = styled\(div, \/\*.+\*\/'(_header__[a-z0-9]+)'/g.exec(
      code
    );
    expect(match).not.toBeNull();
    const css = getCSSForClassName(match[1]);
    expect(css).toMatch('font-size: 3em');
  });

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

  it('should not generate duplicated class names with object properties', () => {
    const regex = /\/\*.+\*\/'(_header(\d)?__[a-z0-9]+)'/g;
    assertAndCheckForDuplications(
      transpile(dedent`
        const header = css\`
          font-size: 3em;
        \`;

        const styles = {
          header: css\`
            font-size: 3em;
          \`,
        };

        const base = {
          header: css\`
            font-size: 3em;
          \`,
          nested: {
            header: css\`
              font-size: 3em;
            \`,
          }
        };
      `),
      regex,
      4,
      'font-size: 3em'
    );
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

  it('should not generate duplicated class names with JSX', () => {
    const regex = /\/\*.+\*\/'(_article(\d)?__[a-z0-9]+)'/g;
    assertAndCheckForDuplications(
      transpile(dedent`
      const article = css\`
        font-size: 3em;
      \`;

      const styles = {
        article: css\`
          font-size: 3em;
        \`,
      };

        <div>
          <article {...styles(css\`font-size: 3em\`)} />
          <article {...styles(css\`font-size: 3em\`)} />
          <div>
            <article {...styles(css\`font-size: 3em\`)} />
          </div>
        </div>
      `),
      regex,
      5,
      'font-size: 3em'
    );
  });
});
