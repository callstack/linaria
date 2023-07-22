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

    const comment = path.node.leadingComments[0];
    if (path.listKey && typeof path.key === 'number' && path.key > 0) {
      const prevNode = path.getSibling(path.key - 1);
      if (prevNode.node.trailingComments?.includes(comment)) {
        // eslint-disable-next-line no-param-reassign
        prevNode.node.trailingComments = prevNode.node.trailingComments?.filter(
          (c) => c !== comment
        );
      }
    }

    // eslint-disable-next-line no-param-reassign
    path.node.leadingComments = null;

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

  it('should remove the whole import', () => {
    const code = run`
      import { a } from './source';

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
      {
        const a = 1;
        /* remove */const b = 2;

        function c() {
          try {
            return a;
          } catch(e) {
            return b;
          }
        }
      }
    `;

    expect(code).toMatchSnapshot();
  });

  it('should remove node if it becomes invalid after removing its children', () => {
    const code = run`
      /* remove */const mode = "DEV";

      if (mode !== "DEV") {
      }
    `;

    expect(code).toMatchSnapshot();
  });

  it('should not delete params of functions', () => {
    const code = run`
      function test(arg) {
        /* remove */console.log(arg);
        return null;
      }
    `;

    expect(code).toMatchSnapshot();
  });

  it('should remove functions with empty bodies', () => {
    const code = run`
      function container() {
        function testFn(arg) {
          /* remove */console.log(arg);
        }

        const testArrow = (arg) => {
          /* remove */console.log(arg);
        }
      }
    `;

    expect(code).toBe('function container() {}');
  });

  it('should not remove top-level functions with empty bodies', () => {
    const code = run`
      function testFn(arg) {
        /* remove */console.log(arg);
      }

      export const testArrow1 = (arg) => {
        /* remove */console.log(arg);
      }

      const testArrow2 = (arg) => (
        /* remove */testFn = arg
      )

      export default function testDefaultFn(arg) {
        /* remove */console.log(arg);
      }
    `;

    expect(code).toMatchSnapshot();
  });
});
