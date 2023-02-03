import * as prettier from 'prettier';

import minifyCode from '../minify-code';

describe('minifyCode', () => {
  it('should remove unused code', () => {
    const code = prettier.format(
      minifyCode(`
        const a = 1;
        export const b = 2;
      `)
    );

    expect(code).toMatchInlineSnapshot(`
      "\\"use strict\\";
      Object.defineProperty(exports, \\"__esModule\\", {
        value: !0,
      }),
        Object.defineProperty(exports, \\"b\\", {
          enumerable: !0,
          get: function () {
            return b;
          },
        });
      var b = 2;
      "
    `);
  });
});
