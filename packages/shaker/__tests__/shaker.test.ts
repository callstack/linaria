import { run } from '@linaria/babel-preset/__utils__/strategy-tester';
import dedent from 'dedent';

describe('shaker', () => {
  run(__dirname, require('../src').default, (transpile) => {
    it('should work with wildcard imports', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "@linaria/core";
      import * as mod from "@linaria/babel-preset/__fixtures__/complex-component";

      export const square = css\`
        ${'${mod.Title}'} {
          color: red;
        }
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should interpolate imported components', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "@linaria/core";
      import { Title } from "@linaria/babel-preset/__fixtures__/complex-component";

      export const square = css\`
        ${'${Title}'} {
          color: red;
        }
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should interpolate imported variables', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "@linaria/core";
      import { whiteColor } from "@linaria/babel-preset/__fixtures__/complex-component";

      export const square = css\`
        color: ${'${whiteColor}'}
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });
  });
});
