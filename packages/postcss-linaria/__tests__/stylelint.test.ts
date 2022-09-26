import stylelint, { type Config } from 'stylelint';

// importing from the package would create circular dependency
// so just import the config directly here
// eslint-disable-next-line import/no-relative-packages
import config from '../../stylelint-config-standard-linaria/src';

// note: need to run pnpm install to pick up updates from any parse/stringify changes
describe('stylelint', () => {
  it('should not error with valid syntax', async () => {
    const source = `
      css\`
        \${expr0}
        .foo {
          \${expr1}: \${expr2};
        }

        \${expr3} {
          .bar {
            color: black;
          }
        }
        \${expr4}
      \`;
    `;
    const result = await stylelint.lint({
      code: source,
      config: config as Config,
    });

    expect(result.errored).toEqual(false);
  });

  it('should be fixable by stylelint', async () => {
    const source = `
      css\`
        .foo { \${expr1}: \${expr2};; }
      \`;`;
    const result = await stylelint.lint({
      code: source,
      config: {
        ...config,
        rules: {
          ...config.rules,
          'no-extra-semicolons': true,
        },
      } as Config,
      fix: true,
    });
    expect(result.errored).toEqual(false);
    expect(result.output).toMatchInlineSnapshot(`
      "
            css\`
              .foo { \${expr1}: \${expr2}; }
            \`;"
    `);
  });

  it('should be fixable by stylelint with styled api', async () => {
    const source = `
      styled.h1\`
        .foo { width: \${p => p.size}px;; }
      \`;`;
    const result = await stylelint.lint({
      code: source,
      config: {
        ...config,
        rules: {
          ...config.rules,
          'no-extra-semicolons': true,
        },
      } as Config,
      fix: true,
    });
    expect(result.errored).toEqual(false);
    expect(result.output).toMatchInlineSnapshot(`
      "
            styled.h1\`
              .foo { width: \${p => p.size}px; }
            \`;"
    `);
  });

  it('should be fixable by stylelint with multi-line expressions', async () => {
    const source = `
      css\`
        $\{expr1}
        .foo { \${expr2}: black;; }
      \`;`;
    const result = await stylelint.lint({
      code: source,
      config: {
        ...config,
        rules: {
          ...config.rules,
          'no-extra-semicolons': true,
        },
      } as Config,
      fix: true,
    });
    expect(result.output).toMatchInlineSnapshot(`
      "
            css\`
              $\{expr1}
              .foo { \${expr2}: black; }
            \`;"
    `);
  });

  it('should be compatible with indentation rule', async () => {
    const source = `
      css\`
          .foo {
              width: 100px;
          }
      \`;
    `;
    const result = await stylelint.lint({
      code: source,
      config: {
        ...config,
        rules: {
          ...config.rules,
          indentation: 4,
        },
      } as Config,
    });

    expect(result.errored).toEqual(false);
  });
});
