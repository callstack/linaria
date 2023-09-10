import { parseSync } from '@babel/core';
import generate from '@babel/generator';
import traverse from '@babel/traverse';
import dedent from 'dedent';

import { removeDangerousCode } from '../removeDangerousCode';

const run = (code: TemplateStringsArray) => {
  const ast = parseSync(dedent(code), {
    filename: 'test.ts',
    presets: ['@babel/preset-typescript'],
  });

  if (!ast) {
    throw new Error('Failed to parse');
  }

  traverse(ast, {
    Program(path) {
      removeDangerousCode(path);
    },
  });

  return generate(ast).code;
};

describe('removeDangerousCode', () => {
  it('should be defined', () => {
    expect(removeDangerousCode).toBeDefined();
  });

  it('should remove `window` but keep `setVersion` function untouched', () => {
    const result = run`
      let _win = undefined;

      try {
        _win = window;
      } catch (e) {
        /* no-op */
      }
      export function setVersion(packageName, packageVersion) {
        if (typeof _win !== 'undefined') {
          return null;
        }
      }
    `;

    expect(result).toMatchSnapshot();
  });
});
