/* eslint-disable no-template-curly-in-string */

import path from 'path';

import { asyncResolveFallback } from '@wyw-in-js/shared';
import { shaker, transform, transformUrl } from '@wyw-in-js/transform';
import dedent from 'dedent';

const outputFilename = './.linaria-cache/test.css';

const rules = [
  {
    test: () => true,
    action: shaker,
  },
];

const basePluginOptions = {
  features: {
    happyDOM: false,
  },
  rules,
};

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
    {
      options: {
        filename: './test.js',
        outputFilename: './.linaria-cache/test.css',
        pluginOptions: {
          ...basePluginOptions,
        },
      },
    },
    dedent`
    import { css } from '@linaria/core';

    export const title = css\`
      background-image: url(./assets/test.jpg);
      background-image: url("./assets/test.jpg");
      background-image: url('./assets/test.jpg');
    \`;
    `,
    asyncResolveFallback
  );

  expect(cssText).toMatchSnapshot();
});

it('rewrites multiple relative paths in url() declarations', async () => {
  const { cssText } = await transform(
    {
      options: {
        filename: './test.js',
        outputFilename,
        pluginOptions: {
          ...basePluginOptions,
        },
      },
    },
    dedent`
    import { css } from '@linaria/core';

    export const title = css\`
      @font-face {
        font-family: Test;
        src: url(./assets/font.woff2) format("woff2"), url(./assets/font.woff) format("woff");
      }
    \`;
    `,
    asyncResolveFallback
  );

  expect(cssText).toMatchSnapshot();
});

it("doesn't rewrite an absolute path in url() declarations", async () => {
  const { cssText } = await transform(
    {
      options: {
        filename: './test.js',
        outputFilename,
        pluginOptions: {
          ...basePluginOptions,
        },
      },
    },
    dedent`
    import { css } from '@linaria/core';

    export const title = css\`
      background-image: url(/assets/test.jpg);
    \`;
    `,
    asyncResolveFallback
  );

  expect(cssText).toMatchSnapshot();
});

it.each(['./test.js', './test.jsx'])(
  'parses JSX in %s before downstream JSX transforms run',
  async (filename) => {
    await expect(
      transform(
        {
          options: {
            filename,
            outputFilename,
            pluginOptions: {
              ...basePluginOptions,
            },
          },
        },
        dedent`
        import { css } from '@linaria/core';

        export const element = <jsx />;
        export const title = css\`
          background-image: url(/assets/test.jpg);
        \`;
        `,
        asyncResolveFallback
      )
    ).resolves.toEqual(
      expect.objectContaining({
        cssText: expect.stringContaining('background-image'),
      })
    );
  }
);

it('does not parse JSX in TypeScript without JSX syntax enabled', async () => {
  await expect(
    transform(
      {
        options: {
          filename: './test.ts',
          outputFilename,
          pluginOptions: {
            ...basePluginOptions,
          },
        },
      },
      dedent`
      import { css } from '@linaria/core';

      export const error = <jsx />;
      `,
      asyncResolveFallback
    )
  ).rejects.toThrow(
    /Expected `>` but found `\/`|Unexpected (JSX expression|token)/
  );
});

it('should return transformed code even when file only contains unused linaria code', async () => {
  const { code } = await transform(
    {
      options: {
        filename: './test.js',
        outputFilename,
        pluginOptions: {
          ...basePluginOptions,
        },
      },
    },
    dedent`
    import { css } from '@linaria/core';

    const title = css\`
      color: red;
    \`;
    `,
    asyncResolveFallback
  );

  expect(code).not.toContain('css`');
});
