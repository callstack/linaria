import { join } from 'path';

import { transformSync } from '@babel/core';
import dedent from 'dedent';

import exportMarkerPlugin from '../export-marker-plugin';

const transform = (only: string[]) => (code: TemplateStringsArray) => {
  const filename = join(__dirname, 'source.js');
  const formattedCode = dedent(code);

  return transformSync(formattedCode, {
    babelrc: false,
    configFile: false,
    filename,
    plugins: [[exportMarkerPlugin, { onlyExports: only }]],
  })!;
};

describe('exportMarkerPlugin', () => {
  it('should keep used exports', () => {
    const { code } = transform(['a', 'b'])`
      export const a = 1;
      export const b = 2;
    `;

    expect(code).toMatchInlineSnapshot(`
      "const a = 1;
      export const b = 2;"
    `);
  });

  it('should remove unused exports', () => {
    const { code } = transform(['a'])`
      export const a = 1;
      export const b = 2;
    `;

    expect(code).toMatchInlineSnapshot(`
      "const a = 1;
      export const b = 2;"
    `);
  });
});
