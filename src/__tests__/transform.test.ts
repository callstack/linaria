/* eslint-disable no-template-curly-in-string */

import dedent from 'dedent';
import transform from '../transform';

it('rewrites a relative path in url() declarations', async () => {
  const { cssText } = await transform(
    dedent`
    import { css } from 'linaria';

    export const title = css\`
      background-image: url(./assets/test.jpg);
    \`;
    `,
    {
      filename: './test.js',
      outputFilename: '../.linaria-cache/test.css',
    }
  );

  expect(cssText).toMatchSnapshot();
});

it('rewrites multiple relative paths in url() declarations', async () => {
  const { cssText } = await transform(
    dedent`
    import { css } from 'linaria';

    export const title = css\`
      @font-face {
        font-family: Test;
        src: url(./assets/font.woff2) format("woff2"), url(./assets/font.woff) format("woff");
      }
    \`;
    `,
    {
      filename: './test.js',
      outputFilename: '../.linaria-cache/test.css',
    }
  );

  expect(cssText).toMatchSnapshot();
});

it("doesn't rewrite an absolute path in url() declarations", async () => {
  const { cssText } = await transform(
    dedent`
    import { css } from 'linaria';

    export const title = css\`
      background-image: url(/assets/test.jpg);
    \`;
    `,
    {
      filename: './test.js',
      outputFilename: '../.linaria-cache/test.css',
    }
  );

  expect(cssText).toMatchSnapshot();
});

it('respects passed babel options', async () => {
  expect.assertions(2);

  expect(() =>
    transform(
      dedent`
      import { css } from 'linaria';

      export const error = <jsx />;
      `,
      {
        filename: './test.js',
        outputFilename: '../.linaria-cache/test.css',
        pluginOptions: {
          babelOptions: {
            babelrc: false,
            configFile: false,
            presets: [['@babel/preset-env', { loose: true }]],
          },
        },
      }
    )
  ).toThrow('Unexpected token');

  expect(() =>
    transform(
      dedent`
      import { css } from 'linaria';

      export const error = <jsx />;
      export const title = css\`
        background-image: url(/assets/test.jpg);
      \`;
      `,
      {
        filename: './test.js',
        outputFilename: '../.linaria-cache/test.css',
        pluginOptions: {
          babelOptions: {
            babelrc: false,
            configFile: false,
            presets: [
              ['@babel/preset-env', { loose: true }],
              '@babel/preset-react',
            ],
          },
        },
      }
    )
  ).not.toThrow('Unexpected token');
});

it("doesn't throw due to duplicate preset", async () => {
  expect.assertions(1);

  expect(() =>
    transform(
      dedent`
      import { styled } from 'linaria/react';

      const Title = styled.h1\` color: blue; \`;

      const Article = styled.article\`
        ${'${Title}'} {
          font-size: 16px;
        }
      \`;
      `,
      {
        filename: './test.js',
        outputFilename: '../.linaria-cache/test.css',
        pluginOptions: {
          babelOptions: {
            babelrc: false,
            configFile: false,
            presets: [require.resolve('../babel')],
            plugins: [
              require.resolve('@babel/plugin-transform-modules-commonjs'),
            ],
          },
        },
      }
    )
  ).not.toThrow('Duplicate plugin/preset detected');
});
