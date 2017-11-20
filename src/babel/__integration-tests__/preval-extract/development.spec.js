/* eslint-disable no-template-curly-in-string */
/* @flow */

import path from 'path';
import dedent from 'dedent';
import { transpile } from '../__utils__/exec';

describe('preval-extract babel plugin', () => {
  it('should use filename for slug creation', () => {
    const { code } = transpile(
      dedent`
    const header = css\`
      font-size: 3em;
    \`;
    `,
      undefined,
      { filename: path.join(process.cwd(), 'test.js') }
    );

    const className = /header = \/\*.+\*\/'(_header__[a-z0-9]+)'/g.exec(code);

    expect(className).not.toBeNull();
  });
});
