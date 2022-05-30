import { join } from 'path';
import dedent from 'dedent';
import { parseSync, types } from '@babel/core';
import traverse from '@babel/traverse';
import getTemplateType from '../../src/utils/getTemplateType';

const run = (code: string) => {
  const opts = { filename: join(__dirname, 'test.js') };
  const rootNode = parseSync(code, opts)!;
  let result: string | null | { component: any } = null;
  traverse(rootNode, {
    TaggedTemplateExpression(path) {
      result = getTemplateType({ types }, path);
    },
  });

  return result;
};

describe('getTemplateType', () => {
  const styledCmp = {
    component: {
      node: {
        name: 'Cmp',
      },
    },
  };

  const styledDiv = {
    component: {
      node: {
        value: 'div',
      },
    },
  };

  it('renamedStyled(Cmp)``', () => {
    const result = run(
      dedent`
      import { styled as renamedStyled } from "@linaria/react";

      const Cmp = () => null;

      export const Square = renamedStyled(Cmp)\`\`;
    `
    );

    expect(result).toMatchObject(styledCmp);
  });

  it('(0, react_1.styled)(Cmp)``', () => {
    const result = run(
      dedent`
      const react_1 = require("@linaria/react");

      const Cmp = () => null;

      export const Square = (0, react_1.styled)(Cmp)\`\`;
    `
    );

    expect(result).toMatchObject(styledCmp);
  });

  it('styled(Cmp)``', () => {
    const result = run(
      dedent`
      import { styled } from "@linaria/react";

      const Cmp = () => null;

      export const Square = styled(Cmp)\`\`;
    `
    );

    expect(result).toMatchObject(styledCmp);
  });

  it('renamedStyled.div``', () => {
    const result = run(
      dedent`
      import { styled as renamedStyled } from "@linaria/react";

      export const Square = renamedStyled.div\`\`;
    `
    );

    expect(result).toMatchObject(styledDiv);
  });

  it('(0, react_1.styled.div)``', () => {
    const result = run(
      dedent`
      const react_1 = require("@linaria/react");

      export const Square = (0, react_1.styled.div)\`\`;
    `
    );

    expect(result).toMatchObject(styledDiv);
  });

  it('styled.div``', () => {
    const result = run(
      dedent`
      import { styled } from "@linaria/react";

      export const Square = styled.div\`\`;
    `
    );

    expect(result).toMatchObject(styledDiv);
  });

  it('(0, core_1.css)``', () => {
    const result = run(
      dedent`
      const core_1 = require("@linaria/core");

      export const square = (0, core_1.css)\`\`;
    `
    );

    expect(result).toEqual('css');
  });

  it('css``', () => {
    const result = run(
      dedent`
      import { css } from "@linaria/core";

      export const square = css\`\`;
    `
    );

    expect(result).toEqual('css');
  });

  it('atomic css``', () => {
    const result = run(
      dedent`
      import { css } from "@linaria/atomic";

      export const square = css\`\`;
    `
    );

    expect(result).toEqual('atomic-css');
  });

  it('re-imported css', () => {
    const result = run(
      dedent`
      import { css } from 'linaria';

      export const square = css\`\`;
    `
    );

    expect(result).toEqual('css');
  });

  it('re-imported styled', () => {
    const result = run(
      dedent`
      import { styled } from 'linaria/react';

      export const Square = styled.div\`\`;
    `
    );

    expect(result).toMatchObject(styledDiv);
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

    expect(result).toMatchObject(styledDiv);
  });

  it('require and destructing', () => {
    const result = run(
      dedent`
      const { styled } = require('@linaria/react');
      export const Square = styled.div\`\`;
    `
    );

    expect(result).toMatchObject(styledDiv);
  });
});
