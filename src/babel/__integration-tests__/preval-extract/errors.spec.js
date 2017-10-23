/* eslint-disable no-template-curly-in-string */
/* @flow */

import dedent from 'dedent';

import { transpile } from '../__utils__/exec';

describe('preval-extract babel plugin errors', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = '';
  });

  it('should throw error if "css" tagged template literal is not assigned to a variable', () => {
    expect(() => {
      transpile(dedent`
      css\`
        font-size: 3em;
      \`;
      `);
    }).toThrowErrorMatchingSnapshot();
  });

  it('should throw error if "css.named" is not called with classname', () => {
    expect(() => {
      transpile(dedent`
      css.named\`
        font-size: 3em;
      \`;
      `);
    }).toThrowErrorMatchingSnapshot();
  });

  it('should throw error if the id was not found', () => {
    expect(() => {
      transpile(dedent`
      const title = css\`
        width: ${'${document.width}'};
      \`;
      `);
    }).toThrowErrorMatchingSnapshot();
  });
});
