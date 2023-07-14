import { join } from 'path';

import { parseSync } from '@babel/core';
import traverse from '@babel/traverse';
import dedent from 'dedent';

import { getTagProcessor } from '@linaria/babel-preset';
import type { BaseProcessor } from '@linaria/tags';

interface IRunOptions {
  ts?: boolean;
}

const run = (code: string, options: IRunOptions = {}): BaseProcessor | null => {
  const opts = {
    filename: join(__dirname, options.ts ? 'test.ts' : 'test.js'),
    root: '.',
    code: true,
    ast: true,
    presets: options.ts ? ['@babel/preset-typescript'] : [],
  };
  const rootNode = parseSync(code, opts)!;
  let result: BaseProcessor | null = null;
  traverse(rootNode, {
    Identifier(path) {
      const processor = getTagProcessor(path, opts, {
        displayName: true,
        evaluate: true,
      });

      if (processor) {
        result = processor;
      }
    },
  });

  return result;
};

function tagToString(processor: BaseProcessor | null): string | undefined {
  if (!processor) return undefined;
  return processor.toString();
}

describe('getTagProcessor', () => {
  it('should find correct import', () => {
    const result = run(
      dedent`
      import { css } from "@linaria/core";
      import { styled as renamedStyled, css as atomicCss } from "@linaria/atomic";

      const Cmp = () => null;

      export const Square = renamedStyled(Cmp)\`\`;
    `
    );

    expect(tagToString(result)).toBe('renamedStyled(Cmp)`…`');
    expect(result?.tagSource).toEqual({
      imported: 'styled',
      source: '@linaria/atomic',
    });
  });

  it('imported component', () => {
    const result = run(
      dedent`
      import Layout from "../__fixtures__/components-library";
      import { styled } from "@linaria/react";

      export const StyledLayout = styled(Layout)\`\`;
    `
    );

    expect(tagToString(result)).toBe('styled(Layout)`…`');
    expect(result?.tagSource).toEqual({
      imported: 'styled',
      source: '@linaria/react',
    });
  });

  it('renamedStyled(Cmp)``', () => {
    const result = run(
      dedent`
      import { styled as renamedStyled } from "@linaria/react";

      const Cmp = () => null;

      export const Square = renamedStyled(Cmp)\`\`;
    `
    );

    expect(tagToString(result)).toBe('renamedStyled(Cmp)`…`');
    expect(result?.tagSource).toEqual({
      imported: 'styled',
      source: '@linaria/react',
    });
  });

  it('(0, react_1.styled)(Cmp)``', () => {
    const result = run(
      dedent`
      const react_1 = require("@linaria/react");

      const Cmp = () => null;

      export const Square = (0, react_1.styled)(Cmp)\`\`;
    `
    );

    expect(tagToString(result)).toBe('react_1.styled(Cmp)`…`');
    expect(result?.tagSource).toEqual({
      imported: 'styled',
      source: '@linaria/react',
    });
  });

  it('styled(Cmp)``', () => {
    const result = run(
      dedent`
      import { styled } from "@linaria/react";

      const Cmp = () => null;

      export const Square = styled(Cmp)\`\`;
    `
    );

    expect(tagToString(result)).toBe('styled(Cmp)`…`');
  });

  it('styled(hoc(Title))``', () => {
    const result = run(
      dedent`
      const { styled } = require('@linaria/react');

      const Title = styled.h1\`
        color: red;
      \`;

      const hoc = Cmp => Cmp;

      export const CustomTitle = styled(hoc(Title))\`
        font-size: 24px;
        color: blue;
      \`;
    `
    );

    expect(tagToString(result)).toBe('styled(hoc(Title))`…`');
  });

  it('styled(() => { someLogic(); })``', () => {
    const result = run(
      dedent`
      const { styled } = require('@linaria/react');

      const someLogic = () => {};

      export const CustomTitle = styled(() => { someLogic(); })\`
        font-size: 24px;
        color: blue;
      \`;
    `
    );

    expect(tagToString(result)).toBe('styled(() => {…})`…`');
  });

  it('renamedStyled.div``', () => {
    const result = run(
      dedent`
      import { styled as renamedStyled } from "@linaria/react";

      export const Square = renamedStyled.div\`\`;
    `
    );

    expect(tagToString(result)).toBe("renamedStyled('div')`…`");
  });

  it('(0, react_1.styled.div)``', () => {
    const result = run(
      dedent`
      const react_1 = require("@linaria/react");

      export const Square = (0, react_1.styled.div)\`\`;
    `
    );

    expect(tagToString(result)).toBe("react_1.styled('div')`…`");
  });

  it('styled.div``', () => {
    const result = run(
      dedent`
      import { styled } from "@linaria/react";

      export const Square = styled.div\`\`;
    `
    );

    expect(tagToString(result)).toBe("styled('div')`…`");
  });

  it('styled("div")``', () => {
    const result = run(
      dedent`
      import { styled } from "@linaria/react";

      export const Square = styled('div')\`\`;
    `
    );

    expect(tagToString(result)).toBe("styled('div')`…`");
  });

  it('(0, core_1.css)``', () => {
    const result = run(
      dedent`
      const core_1 = require("@linaria/core");

      export const square = (0, core_1.css)\`\`;
    `
    );

    expect(tagToString(result)).toBe('core_1.css`…`');
  });

  it('css``', () => {
    const result = run(
      dedent`
      import { css } from "@linaria/core";

      export const square = css\`\`;
    `
    );

    expect(tagToString(result)).toBe('css`…`');
  });

  it('atomic css``', () => {
    const result = run(
      dedent`
      import { css } from "@linaria/atomic";

      export const square = css\`\`;
    `
    );

    expect(tagToString(result)).toBe('css`…`');
    expect(result?.tagSource).toEqual({
      imported: 'css',
      source: '@linaria/atomic',
    });
  });

  it('re-imported css', () => {
    const result = run(
      dedent`
      import { css } from 'linaria';

      export const square = css\`\`;
    `
    );

    expect(tagToString(result)).toBe('css`…`');
    expect(result?.tagSource).toEqual({
      imported: 'css',
      source: 'linaria',
    });
  });

  it('re-imported styled', () => {
    const result = run(
      dedent`
      import { styled } from 'linaria/react';

      export const Square = styled.div\`\`;
    `
    );

    expect(tagToString(result)).toBe("styled('div')`…`");
    expect(result?.tagSource).toEqual({
      imported: 'styled',
      source: 'linaria/react',
    });
  });

  it('import from unknown package', () => {
    const result = run(
      dedent`
      import { styled } from '@linaria/babel-preset';

      export const Square = styled.div\`\`;
    `
    );

    expect(result).toBeNull();
  });

  it('require and access with prop', () => {
    const result = run(
      dedent`
      const renamedStyled = require('@linaria/react').styled;
      export const Square = renamedStyled.div\`\`;
    `
    );

    expect(tagToString(result)).toBe("renamedStyled('div')`…`");
  });

  it('require and destructing', () => {
    const result = run(
      dedent`
      const { styled } = require('@linaria/react');
      export const Square = styled.div\`\`;
    `
    );

    expect(tagToString(result)).toBe("styled('div')`…`");
  });

  describe('invalid usage', () => {
    it('css.div``', () => {
      const runner = () =>
        run(
          dedent`import { css } from "@linaria/core"; export const square = css.div\`\`;`
        );

      expect(runner).toThrow('Invalid usage of template tag');
    });

    it('css("div")``', () => {
      const runner = () =>
        run(
          dedent`import { css } from "@linaria/core"; export const square = css("div")\`\`;`
        );

      expect(runner).toThrow('Invalid usage of template tag');
    });

    it('do not throw if css is not a tag', () => {
      const runner = () => run(dedent`export { css } from "@linaria/core";`);

      expect(runner).not.toThrow();
    });

    it('styled`` tag', () => {
      const runner = () =>
        run(
          dedent`import { styled } from "@linaria/react"; export const square = styled\`\`;`
        );

      expect(runner).toThrow('Invalid usage of `styled` tag');
    });

    it('do not throw if styled is not a tag', () => {
      const runner = () =>
        run(
          dedent`
          import { styled } from '@linaria/react';

          export type StyledReturn = ReturnType<typeof styled>;
        `,
          { ts: true }
        );

      expect(runner).not.toThrow();
    });

    it('styled.div.span`` tag', () => {
      const runner = () =>
        run(
          dedent`import { styled } from "@linaria/react"; export const square = styled.div.span\`\`;`
        );

      expect(runner).toThrow('Invalid usage of `styled` tag');
    });

    it('styled("div").span`` tag', () => {
      const runner = () =>
        run(
          dedent`import { styled } from "@linaria/react"; export const square = styled("div").span\`\`;`
        );

      expect(runner).toThrow('Invalid usage of `styled` tag');
    });
  });

  it('imported from a non-linaria library', () => {
    const result = run(
      dedent`
      import { Title } from "../__fixtures__/non-linaria-ui-library/index";
      import { styled } from "@linaria/react";

      export const StyledLayout = styled(Title)\`\`;
    `
    );

    expect(tagToString(result)).toBe('styled(Title)`…`');
    expect(result?.dependencies).toHaveLength(0);
    expect(result?.tagSource).toEqual({
      imported: 'styled',
      source: '@linaria/react',
    });
  });

  it('imported from a linaria library', () => {
    const result = run(
      dedent`
      import { Title } from "../__fixtures__/linaria-ui-library/components/index";
      import { styled } from "@linaria/react";

      export const StyledTitle = styled(Title)\`\`;
    `
    );

    expect(tagToString(result)).toBe('styled(Title)`…`');
    expect(result?.dependencies).toMatchObject([{ source: 'Title' }]);
    expect(result?.tagSource).toEqual({
      imported: 'styled',
      source: '@linaria/react',
    });
  });

  it('imported a non-linaria component from a linaria library', () => {
    const result = run(
      dedent`
      import { Title } from "../__fixtures__/linaria-ui-library/non-linaria-components";
      import { styled } from "@linaria/react";

      export const StyledTitle = styled(Title)\`\`;
    `
    );

    expect(tagToString(result)).toBe('styled(Title)`…`');
    expect(result?.dependencies).toHaveLength(0);
    expect(result?.tagSource).toEqual({
      imported: 'styled',
      source: '@linaria/react',
    });
  });

  it('imported a non-linaria component from a linaria library (and casted with as)', () => {
    const result = run(
      dedent`
      import { Title } from "../__fixtures__/linaria-ui-library/non-linaria-components";
      import { styled } from "@linaria/react";

      export const StyledTitle = styled(Title as unknown)\`\`;
    `,
      { ts: true }
    );

    expect(tagToString(result)).toBe('styled(Title as unknown)`…`');
    expect(result?.dependencies).toHaveLength(0);
    expect(result?.tagSource).toEqual({
      imported: 'styled',
      source: '@linaria/react',
    });
  });

  it('imported a non-linaria component from a linaria library (and used with connect)', () => {
    const result = run(
      dedent`
      import { Title } from "../__fixtures__/linaria-ui-library/non-linaria-components";
      import { styled } from "@linaria/react";
      import { connect } from "react-redux";

      export const StyledTitle = styled(connect(Title))\`\`;
    `,
      { ts: true }
    );

    expect(tagToString(result)).toBe('styled(connect(Title))`…`');
    expect(result?.dependencies).toHaveLength(0);
    expect(result?.tagSource).toEqual({
      imported: 'styled',
      source: '@linaria/react',
    });
  });

  it('imported from a linaria library (and used with connect)', () => {
    const result = run(
      dedent`
      import { Title } from "../__fixtures__/linaria-ui-library/components/index";
      import { connect } from "./__fixtures__/linaria-ui-library/hocs";
      import { styled } from "@linaria/react";

      export const StyledTitle = styled(connect(Title))\`\`;
    `
    );

    expect(tagToString(result)).toBe('styled(connect(Title))`…`');
    expect(result?.dependencies).toMatchObject([{ source: 'connect(Title)' }]);
    expect(result?.tagSource).toEqual({
      imported: 'styled',
      source: '@linaria/react',
    });
  });
});
