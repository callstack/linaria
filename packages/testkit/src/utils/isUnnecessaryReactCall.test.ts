import { join } from 'path';

import * as babel from '@babel/core';
import type { NodePath } from '@babel/core';
import type { Program } from '@babel/types';
import dedent from 'dedent';

import type { MissedBabelCoreTypes } from '@linaria/babel-preset';
import { isUnnecessaryReactCall } from '@linaria/utils';

const { File } = babel as typeof babel & MissedBabelCoreTypes;

const check = (rawCode: TemplateStringsArray): boolean => {
  const code = dedent(rawCode);
  const filename = join(__dirname, 'source.ts');
  const ast = babel.parse(code, {
    babelrc: false,
    configFile: false,
    filename,
    presets: ['@babel/preset-typescript'],
  })!;

  const file = new File({ filename }, { code, ast });
  const program = file.path.find((p) =>
    p.isProgram()
  ) as NodePath<Program> | null;
  const body = program?.get('body') ?? [];
  const lastStatement = body[body.length - 1];
  if (!lastStatement || !lastStatement.isExpressionStatement()) {
    throw new Error('Last statement is not an expression statement');
  }

  const expression = lastStatement.get('expression');
  if (!expression.isCallExpression()) {
    throw new Error('Last statement is not a call expression');
  }

  return isUnnecessaryReactCall(expression);
};

describe('isUnnecessaryReactCall', () => {
  describe('jsx-runtime', () => {
    it('should process simple usage', () => {
      const result = check`
        const jsx_runtime_1 = require("react/jsx-runtime").jsx;
        jsx_runtime_1("span", null, "Hello World");
      `;

      expect(result).toBe(true);
    });

    it('should process usage wrapped with SequenceExpression', () => {
      const result = check`
        const jsx_runtime_1 = require("react/jsx-runtime").jsx;
        (0, jsx_runtime_1)("span", null, "Hello World");
      `;

      expect(result).toBe(true);
    });

    it('should process namespaced', () => {
      const result = check`
        const jsx_runtime_1 = require("react/jsx-runtime");
        (0, jsx_runtime_1.jsx)("div", null, "Hello World");
        (0, jsx_runtime_1.jsx)("span", null, "Hello World");
        (0, jsx_runtime_1.jsxs)("div", null, "Hello World");
        (0, jsx_runtime_1.jsxs)("span", null, "Hello World");
      `;

      expect(result).toBe(true);
    });
  });

  describe('classic react', () => {
    it('should process createElement', () => {
      const result = check`
        const react_1 = require("react");
        (0, react_1.createElement)("div", null, "Hello World");
      `;

      expect(result).toBe(true);
    });

    it('should process hooks', () => {
      const result = check`
        const react_1 = require("react");
        (0, react_1.useState)(null);
      `;

      expect(result).toBe(true);
    });

    it('should ignore createContext', () => {
      const result = check`
        const react_1 = require("react");
        (0, react_1.createContext)();
      `;

      expect(result).toBe(false);
    });
  });
});
