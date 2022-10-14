import { join } from 'path';

import { transformSync } from '@babel/core';
import dedent from 'dedent';

import { preeval } from '@linaria/babel-preset';

const run = (code: TemplateStringsArray) => {
  const filename = join(__dirname, 'source.js');
  const formattedCode = dedent(code);

  const transformed = transformSync(formattedCode, {
    babelrc: false,
    configFile: false,
    filename,
    plugins: [
      [
        preeval,
        {
          evaluate: true,
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
});
