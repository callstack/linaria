import { join } from 'path';

import { transformSync } from '@babel/core';
import dedent from 'dedent';

import { preeval } from '@linaria/babel-preset';

const run = (code: TemplateStringsArray) => {
  const filename = join(__dirname, 'source.ts');
  const formattedCode = dedent(code);

  const transformed = transformSync(formattedCode, {
    babelrc: false,
    configFile: false,
    filename,
    plugins: [
      '@babel/plugin-syntax-typescript',
      [
        preeval,
        {
          evaluate: true,
          features: {
            dangerousCodeRemover: true,
          },
        },
      ],
    ],
  });

  if (!transformed) {
    throw new Error(`Something went wrong with ${filename}`);
  }

  return {
    code: transformed.code,
    // metadata: transformed.metadata.__linariaShaker,
  };
};

describe('preeval', () => {
  it('should keep getGlobal but remove window-related code', () => {
    const { code } = run`
      function getGlobal() {
        if (typeof globalThis !== "undefined") {
          return globalThis;
        }

        if (typeof window !== "undefined") {
          return window;
        }

        if (typeof global !== "undefined") {
          return global;
        }

        if (typeof self !== "undefined") {
          return self;
        }

        return mockGlobal;
      }
    `;

    expect(code).toMatchSnapshot();
  });

  it('should remove usages of window scoped identifiers', () => {
    const { code } = run`
      $RefreshReg$("Container");
      if (import.meta.hot) {
        window.$RefreshReg$ = () => {};
      }

      $RefreshReg$("Header");
    `;

    expect(code).toMatchSnapshot();
  });

  it('should not remove "location" in types only because it looks like a global variable', () => {
    const { code } = run`
      interface IProps {
        fn: (location: string) => void;
      }
    `;

    expect(code).toMatchSnapshot();
  });

  it('should keep object members that look like window globals', () => {
    const { code } = run`
      class Test {
        fetch: typeof global.fetch;
        constructor(options) {
          this.fetch = options.fetch;
        }
      }
    `;

    expect(code).toMatchSnapshot();
  });

  it('should keep type parameters that look like window globals', () => {
    const { code } = run`
      const blah = window.Foo;
      type FooType = Generic<Foo>;
    `;

    expect(code).toMatchSnapshot();
  });
});
