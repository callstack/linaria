/* eslint-env jest */
import { join } from 'path';

import * as babel from '@babel/core';
import generator from '@babel/generator';
import dedent from 'dedent';

import type { MissedBabelCoreTypes } from '@linaria/babel-preset';
import { extractExpression } from '@linaria/utils';

const { File } = babel as typeof babel & MissedBabelCoreTypes;

const run = (rawCode: TemplateStringsArray, evaluate: boolean) => {
  const code = dedent(rawCode);
  const filename = join(__dirname, 'source.ts');

  const ast = babel.parse(code, {
    babelrc: false,
    configFile: false,
    filename,
    presets: ['@babel/preset-typescript'],
  })!;

  const file = new File({ filename }, { code, ast });

  file.path.traverse({
    Expression(path) {
      if (
        !path.node.leadingComments?.length ||
        path.node.leadingComments[0].value.trim() !== 'extract'
      ) {
        return;
      }

      // eslint-disable-next-line no-param-reassign
      path.node.leadingComments = [];

      extractExpression(path, evaluate);
    },
  });

  const bindings = Object.keys(file.path.scope.bindings);
  bindings.sort();

  return {
    bindings,
    code: generator(file.path.node).code,
  };
};

const runWithEval = (code: TemplateStringsArray) => run(code, true);
const runWithoutEval = (code: TemplateStringsArray) => run(code, false);

describe('extractExpression', () => {
  it('should extract expression', () => {
    const { bindings, code } = runWithoutEval`
      function foo() {
        const a = 1;
        const b = 2;

        return /* extract */(a + b);
      }
    `;

    expect(code).toMatchSnapshot();
    expect(bindings).toEqual(['_exp', 'a', 'b', 'foo']);
  });

  it('should rename identifier if it already exists in the root', () => {
    const { bindings, code } = runWithoutEval`
      const a = 42;

      function foo() {
        const a = 1;
        const b = 2;

        return /* extract */(a + b);
      }
    `;

    expect(code).toMatchSnapshot();
    expect(bindings).toEqual(['_a', '_exp', 'a', 'b', 'foo']);
  });

  it('should inline values and remove bindings', () => {
    const { bindings, code } = runWithEval`
      function foo() {
        const a = 1;
        const b = 2;

        return /* extract */(a + b);
      }
    `;

    expect(code).toMatchSnapshot();
    expect(bindings).toEqual(['_exp', 'foo']);
  });

  it('should hoist functions', () => {
    const { bindings, code } = runWithoutEval`
      function foo() {
        const a = "foo";

        const fn = (obj) => obj.className ?? '';

        return /* extract */(a + fn({ className: 'bar' }));
      }
    `;

    expect(code).toMatchSnapshot();
    expect(bindings).toEqual(['_exp', 'a', 'fn', 'foo']);
  });

  it('should ignore types', () => {
    const { bindings, code } = runWithoutEval`
      function foo() {
        const a = "foo";

        type Props = { className?: string; children?: React.ReactNode };
        const fn = (obj: Props) => obj.className ?? '';

        return /* extract */(a + fn({ className: 'bar' }));
      }
    `;

    expect(code).toMatchSnapshot();
    expect(bindings).toEqual(['_exp', 'a', 'fn', 'foo']);
  });
});
