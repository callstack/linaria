import * as babel from '@babel/core';
import { parseAsync } from '@babel/core';
import generate from '@babel/generator';
import dedent from 'dedent';
import stripAnsi from 'strip-ansi';

import { extractExpression } from '@linaria/utils';

import type { MissedBabelCoreTypes } from '../../types';

const { File } = babel as typeof babel & MissedBabelCoreTypes;

async function go(code: string): Promise<string> {
  const parsed = (await parseAsync(code, {
    filename: __filename,
  }))!;

  const file = new File({ filename: __filename }, { code, ast: parsed });

  file.path.traverse({
    TemplateLiteral(path) {
      const expressions = path.get('expressions');
      expressions.forEach((exp) => {
        if (exp.isExpression()) {
          extractExpression(exp, true);
        }
      });
    },
  });

  return generate(parsed).code;
}

describe('collectTemplateDependencies', () => {
  it('hoist expressions', async () => {
    const code = dedent`
      import x from "module";

      function fn() {
        const value = 21;
        const variable = "test";
        const result = "result";
        const template = tag\`${'${value * 2}'}${'${variable}'}${'${(() => result)}'}${'${value * x}'}\`;
      }
    `;

    expect(await go(code)).toMatchSnapshot();
  });

  it('should hoist expressions after imports', async () => {
    const code = dedent`
      import { styled } from '@linaria/react';
      import slugify from '../__fixtures__/slugify';

      export const Title = styled.h1\`
        &:before {
          content: "${"${slugify('test')}"}"
        }
      \`;
    `;

    expect(await go(code)).toMatchSnapshot();
  });

  it('non-hoistable expression', async () => {
    expect.assertions(1);

    const code = dedent`
      function fn(arg) {
        {
          const base = "base";
          const variable = base + arg;
          const template = tag\`${'${variable}'}\`;
        }
      }
    `;

    try {
      await go(code);
    } catch (e) {
      expect(stripAnsi((e as { message: string }).message)).toMatchSnapshot();
    }
  });

  it('hoist chain of statements', async () => {
    const code = dedent`
      import str from "module";

      function fn() {
        {
          const arg = str;
          const variable = arg + "2";
          const template = tag\`${'${variable}'}\`;
        }
      }
    `;

    expect(await go(code)).toMatchSnapshot();
  });

  it('hoistExpression with destructuring', async () => {
    const code = dedent`
      function fn() {
        const result = "result";
        const { variable } = { variable: result };
        const template = tag\`${'${variable}'}\`;
      }
    `;

    expect(await go(code)).toMatchSnapshot();
  });

  it('hoistExpression with object', async () => {
    const code = dedent`
      const obj = {
        variable: "test",
      }

      function fn() {
        const template = tag\`${'${obj.variable}'}\`;
      }
    `;

    expect(await go(code)).toMatchSnapshot();
  });
});
