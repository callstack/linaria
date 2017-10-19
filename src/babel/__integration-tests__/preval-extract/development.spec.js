/* eslint-disable no-template-curly-in-string */
/* @flow */

import path from 'path';
import dedent from 'dedent';
import { transpile } from '../__utils__/exec';

describe('preval-extract babel plugin', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = '';
  });

  it('in development should use filename for slug creation', () => {
    process.env.BABEL_ENV = '';
    const { code: codeWithSlugFromContent } = transpile(dedent`
    const header = css\`
      font-size: 3em;
    \`;
    `);

    process.env.BABEL_ENV = 'production';
    const { code: codeWithSlugFromFilename } = transpile(
      dedent`
      const header = css\`
        font-size: 3em;
      \`;
      `,
      undefined,
      { filename: path.join(process.cwd(), 'test.js') }
    );

    const classnameWithSlugFromContent = /header = '(header__[a-z0-9]+)'/g.exec(
      codeWithSlugFromContent
    );
    const classnameWithSlugFromFilename = /header = '(header__[a-z0-9]+)'/g.exec(
      codeWithSlugFromFilename
    );

    expect(classnameWithSlugFromContent).not.toBeNull();
    expect(classnameWithSlugFromFilename).not.toBeNull();
    expect(classnameWithSlugFromContent[0]).not.toEqual(
      codeWithSlugFromFilename[0]
    );
  });
});
