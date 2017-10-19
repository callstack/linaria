/* eslint-disable no-template-curly-in-string */
/* @flow */

import path from 'path';
import dedent from 'dedent';
import { extract } from '../__utils__/exec';

describe('preval-extract babel plugin with extraction enabled', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = '';
  });

  it('should extract all styles to a single file', () => {
    const filename = path.join(process.cwd(), 'test.js');
    const { data: data1, filenames: filenames1 } = extract(
      dedent`
        const header = css\`
          font-size: 3em;
        \`;
        `,
      { single: true },
      { filename }
    );

    const { data: data2, filenames: filenames2 } = extract(
      dedent`
        const body = css\`
          font-weight: bold;
        \`;
        `,
      { single: true },
      { filename }
    );

    expect(filenames1).toEqual(filenames2);
    expect(data1).toMatchSnapshot();
    expect(data2).toMatchSnapshot();
  });

  it('should extract each style to separate file and include it into source file', () => {
    const filename1 = path.join(process.cwd(), 'test1.js');
    const filename2 = path.join(process.cwd(), 'test2.js');

    const {
      data: data1,
      filenames: filenames1,
      transpiled: transpiled1,
    } = extract(
      dedent`
        const header = css\`
          font-size: 3em;
        \`;
        `,
      undefined,
      { filename: filename1 }
    );

    const {
      data: data2,
      filenames: filenames2,
      transpiled: transpiled2,
    } = extract(
      dedent`
        const body = css\`
          font-weight: bold;
        \`;
        `,
      undefined,
      { filename: filename2 }
    );

    expect(transpiled1).toMatch(
      `require('${path.join(process.cwd(), '.linaria-cache/test1.css')}')`
    );
    expect(transpiled2).toMatch(
      `require('${path.join(process.cwd(), '.linaria-cache/test2.css')}')`
    );

    expect(data1).toMatchSnapshot();
    expect(data2).toMatchSnapshot();
    expect(filenames1).toEqual([
      path.join(process.cwd(), '.linaria-cache/test1.css'),
    ]);
    expect(filenames2).toEqual([
      path.join(process.cwd(), '.linaria-cache/test2.css'),
    ]);
  });

  it('extract styles to a given file', () => {
    const filename = path.join(process.cwd(), 'test.js');
    const { data, filenames } = extract(
      dedent`
        const header = css\`
          font-size: 3em;
        \`;
        `,
      { single: true, filename: 'styles-static.css', cache: false },
      { filename }
    );

    expect(filenames).toEqual([
      path.join(path.dirname(filename), '.linaria-cache/styles-static.css'),
    ]);
    expect(data).toMatchSnapshot();
  });

  it('extract styles to a given file with output directory specified', () => {
    const filename = path.join(process.cwd(), 'test.js');
    const { data, filenames } = extract(
      dedent`
        const header = css\`
          font-size: 3em;
        \`;
        `,
      {
        single: true,
        filename: 'styles-static.css',
        outDir: 'output',
        cache: false,
      },
      { filename }
    );

    expect(filenames).toEqual([
      path.join(path.dirname(filename), 'output/styles-static.css'),
    ]);
    expect(data).toMatchSnapshot();
  });
});
