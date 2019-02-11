import dedent from 'dedent';

const transform = require('../transform');

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
