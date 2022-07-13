/* eslint-env jest */
import { join } from 'path';

import * as babel from '@babel/core';
import type { NodePath } from '@babel/core';
import generator from '@babel/generator';
import dedent from 'dedent';

import type { MissedBabelCoreTypes } from '@linaria/babel-preset';
import { removeWithRelated } from '@linaria/utils';

const { File } = babel as typeof babel & MissedBabelCoreTypes;

const run = (rawCode: TemplateStringsArray) => {
  const code = dedent(rawCode);
  const filename = join(__dirname, 'source.ts');

  const ast = babel.parse(code, {
    babelrc: false,
    configFile: false,
    filename,
    presets: ['@babel/preset-typescript'],
  })!;

  const file = new File({ filename }, { code, ast });

  const visitor = (path: NodePath) => {
    if (
      !path.node.leadingComments?.length ||
      path.node.leadingComments[0].value.trim() !== 'remove'
    ) {
      return;
    }

    // eslint-disable-next-line no-param-reassign
    path.node.leadingComments = [];

    removeWithRelated([path]);
  };

  file.path.traverse({
    Expression: visitor,
    Statement: visitor,
  });

  return generator(file.path.node).code;
};

describe('removeWithRelated', () => {
  it('should keep alive used import specifier', () => {
    const code = run`
      import { a, b } from './source';

      /* remove */a;
    `;

    expect(code).toMatchSnapshot();
  });

  it('should remove try/catch block', () => {
    const code = run`
      const a = 1;

      try {
        /* remove */42;
      } catch (e) {
      }
    `;

    expect(code).toMatchSnapshot();
  });

  it('should remove export', () => {
    const code = run`
      function a() {
        /* remove */42;
      }

      function checkIsBrowser() {
        return /* remove */42;
      }

      const canUseDOM = checkIsBrowser();

      const b = 1;

      export { a, b, canUseDOM };
    `;

    expect(code).toMatchSnapshot();
  });

  it('should keep logical expression', () => {
    const code = run`
      const a = 1;
      /* remove */const b = 2;
      const c = 3;

      const res = a && b && c;
    `;

    expect(code).toMatchSnapshot();
  });

  it('should shake try/catch', () => {
    const code = run`
      const a = 1;
      /* remove */const b = 2;

      function c() {
        try {
          return a;
        } catch(e) {
          return b;
        }
      }
    `;

    expect(code).toMatchSnapshot();
  });
});
