/* eslint-disable no-template-curly-in-string */

import path from 'path';

import dedent from 'dedent';

import { transform, transformUrl } from '@linaria/babel-preset';
import { asyncResolveFallback } from '@linaria/utils';

const outputFilename = './.linaria-cache/test.css';

const rules = [
  {
    test: () => true,
    action: require('@linaria/shaker').default,
  },
];

describe('transformUrl', () => {
  type TransformUrlArgs = Parameters<typeof transformUrl>;
  const dataset: Record<string, TransformUrlArgs> = {
    '../assets/test.jpg': [
      './assets/test.jpg',
      './.linaria-cache/test.css',
      './test.js',
    ],
    '../a/b/test.jpg': [
      '../a/b/test.jpg',
      './.linaria-cache/test.css',
      './a/test.js',
    ],
  };

  it('should work with posix paths', () => {
    Object.keys(dataset).forEach((result) => {
      expect(transformUrl(...dataset[result])).toBe(result);
    });
  });

  it('should work with win32 paths', () => {
    const toWin32 = (p: string) => p.split(path.posix.sep).join(path.win32.sep);
    const win32Dataset = Object.keys(dataset).reduce(
      (acc, key) => ({
        ...acc,
        [key]: [
          dataset[key][0],
          toWin32(dataset[key][1]),
          toWin32(dataset[key][2]),
          path.win32,
        ] as TransformUrlArgs,
      }),
      {} as Record<string, TransformUrlArgs>
    );

    Object.keys(win32Dataset).forEach((result) => {
      expect(transformUrl(...win32Dataset[result])).toBe(result);
    });
  });
});

it('rewrites a relative path in url() declarations', async () => {
  const { cssText } = await transform(
    dedent`
    import { css } from '@linaria/core';

    export const title = css\`
      background-image: url(./assets/test.jpg);
      background-image: url("./assets/test.jpg");
      background-image: url('./assets/test.jpg');
    \`;
    `,
    {
      filename: './test.js',
      outputFilename: './.linaria-cache/test.css',
      pluginOptions: {
        rules,
      },
    },
    asyncResolveFallback
  );

  expect(cssText).toMatchSnapshot();
});

it('rewrites multiple relative paths in url() declarations', async () => {
  const { cssText } = await transform(
    dedent`
    import { css } from '@linaria/core';

    export const title = css\`
      @font-face {
        font-family: Test;
        src: url(./assets/font.woff2) format("woff2"), url(./assets/font.woff) format("woff");
      }
    \`;
    `,
    {
      filename: './test.js',
      outputFilename,
      pluginOptions: {
        rules,
      },
    },
    asyncResolveFallback
  );

  expect(cssText).toMatchSnapshot();
});

it("doesn't rewrite an absolute path in url() declarations", async () => {
  const { cssText } = await transform(
    dedent`
    import { css } from '@linaria/core';

    export const title = css\`
      background-image: url(/assets/test.jpg);
    \`;
    `,
    {
      filename: './test.js',
      outputFilename,
      pluginOptions: {
        rules,
      },
    },
    asyncResolveFallback
  );

  expect(cssText).toMatchSnapshot();
});

it('respects passed babel options', async () => {
  expect.assertions(2);

  await expect(() =>
    transform(
      dedent`
        import { css } from '@linaria/core';

        export const error = <jsx />;
        `,
      {
        filename: './test.js',
        outputFilename,
        pluginOptions: {
          rules,
          babelOptions: {
            babelrc: false,
            configFile: false,
            presets: [['@babel/preset-env', { loose: true }]],
          },
        },
      },
      asyncResolveFallback
    )
  ).rejects.toThrow(
    /Support for the experimental syntax 'jsx' isn't currently enabled/
  );

  await expect(() =>
    transform(
      dedent`
      import { css } from '@linaria/core';

      export const error = <jsx />;
      export const title = css\`
        background-image: url(/assets/test.jpg);
      \`;
      `,
      {
        filename: './test.js',
        outputFilename,
        pluginOptions: {
          rules,
          babelOptions: {
            babelrc: false,
            configFile: false,
            presets: [
              ['@babel/preset-env', { loose: true }],
              '@babel/preset-react',
            ],
          },
        },
      },
      asyncResolveFallback
    )
  ).not.toThrow('Unexpected token');
});

it("doesn't throw due to duplicate preset", async () => {
  expect.assertions(1);

  expect(() =>
    transform(
      dedent`
      import { styled } from '@linaria/react';

      const Title = styled.h1\` color: blue; \`;

      const Article = styled.article\`
        ${'${Title}'} {
          font-size: 16px;
        }
      \`;
      `,
      {
        filename: './test.js',
        outputFilename,
        pluginOptions: {
          rules,
          babelOptions: {
            babelrc: false,
            configFile: false,
            presets: [require.resolve('@linaria/babel-preset')],
            plugins: [
              require.resolve('@babel/plugin-transform-modules-commonjs'),
            ],
          },
        },
      },
      asyncResolveFallback
    )
  ).not.toThrow('Duplicate plugin/preset detected');
});

it('should return transformed code even when file only contains unused linaria code', async () => {
  const { code } = await transform(
    dedent`
    import { css } from '@linaria/core';

    const title = css\`
      color: red;
    \`;
    `,
    {
      filename: './test.js',
      outputFilename,
      pluginOptions: {
        rules,
      },
    },
    asyncResolveFallback
  );

  expect(code).not.toContain('css`');
});
