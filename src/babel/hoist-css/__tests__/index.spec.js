/* eslint-disable no-template-curly-in-string */
/* @flow */

import * as babel from 'babel-core';

function transpile(source) {
  return babel.transform(source, {
    presets: ['react'],
    plugins: [require.resolve('../index')],
    babelrc: false,
  });
}

describe('hoist-css babel plugin', () => {
  it('should hoist CSS from JSX from styles', () => {
    const { code } = transpile(`
      function MyComponent() {
        return (
          <article
            id="post"
            {...styles(css\`color: \${colors.red};\`, css\`font-size: 12px;\`)}
          />
        );
      }
    `);

    expect(code).toMatchSnapshot();
  });

  it('should hoist named CSS from JSX from styles', () => {
    const { code } = transpile(`
      function MyComponent() {
        return (
          <article
            id="post"
            {...styles(css.named('test')\`color: \${colors.red};\`, css\`font-size: 12px;\`)}
          />
        );
      }
    `);

    expect(code).toMatchSnapshot();
  });

  it('should not affect other template literals in styles', () => {
    const { code } = transpile(`
      function MyComponent() {
        <article
          id="post"
          {...styles(sass\`color: \${colors.red};\`, \`font-size: 12px;\`)}
        />
      }
    `);

    expect(code).toMatchSnapshot();
  });

  it('should hoist CSS from JSX from className', () => {
    const { code } = transpile(`
      function MyComponent() {
        return (
          <article
            className={css\`color: \${colors.red};\`}
          />
        );
      }
    `);

    expect(code).toMatchSnapshot();
  });

  it('should not affect other template literals in className', () => {
    const { code } = transpile(`
      function MyComponent() {
        <article
          className={sass\`color: \${colors.red};\`}
        />
      }
    `);

    expect(code).toMatchSnapshot();
  });

  it('should hoist CSS from JSX from class', () => {
    const { code } = transpile(`
      function MyComponent() {
        return (
          <article
            class={css\`color: \${colors.red};\`}
          />
        );
      }
    `);

    expect(code).toMatchSnapshot();
  });

  it('should not affect other template literals in class', () => {
    const { code } = transpile(`
      function MyComponent() {
        <article
          class={\`color: \${colors.red};\`}
        />
      }
    `);

    expect(code).toMatchSnapshot();
  });

  it('should noop if no styles or class present', () => {
    const { code } = transpile(`
      function MyComponent() {
        return <article id="post" />;
      }
    `);

    expect(code).toMatchSnapshot();
  });
});
