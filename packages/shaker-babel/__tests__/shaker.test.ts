import { run } from '@linaria/babel-preset/__utils__/strategy-tester';
import dedent from 'dedent';

describe('shaker-babel', () => {
  run(__dirname, require('../src').default, (transpile) => {
    it('should work with wildcard imports', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "@linaria/core";
      import * as mod from "@linaria/babel-preset/__fixtures__/complex-component";

      const color = mod["whiteColor"];

      export const square = css\`
        ${'${mod.Title}'} {
          color: ${'${color}'};
        }
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('assigning to exports', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "@linaria/core";
      import { Padding } from "../__fixtures__/assignToExport";

      export const square = css\`
        div {
          padding: ${'${Padding}'}px;
        }
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('exporting objects', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "@linaria/core";
      import object from "../__fixtures__/objectExport";

      export const square = css\`
        div {
          margin: ${'${object.margin}'}px;
        }
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('exporting objects with computed keys', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "@linaria/core";
      import { object } from "../__fixtures__/computedKeys";

      export const square = css\`
        div {
          color: ${'${object.blue}'};
        }
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('exporting sequence expressions', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "@linaria/core";
      import number from "../__fixtures__/sequenceExport";

      export const square = css\`
        div {
          height: ${'${number}'}px;
        }
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should work with wildcard reexports', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "@linaria/core";
      import { foo1 } from "../__fixtures__/reexports";

      export const square = css\`
        color: ${'${foo1}'};
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

    it('evaluates typescript enums', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { styled } from '@linaria/react';

      enum Colors {
        BLUE = '#27509A'
      }

      export const Title = styled.h1\`
        color: ${'${Colors.BLUE}'};
      \`;
      `,
        (config) => ({
          ...config,
          presets: ['@babel/preset-typescript', ...(config.presets ?? [])],
          filename: 'source.ts',
        })
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('evaluates chain of reexports', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { styled } from '@linaria/react';
      import { fooStyles } from "@linaria/babel-preset/__fixtures__/reexports";

      const value = fooStyles.foo;

      export const H1 = styled.h1\`
        color: ${'${value}'};
      \`
      `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });
  });
});
