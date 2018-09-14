/* eslint-disable no-template-curly-in-string */
/* @flow */

import dedent from 'dedent';

import { transpile } from '../__utils__/exec';

describe('preval-extract babel plugin code frames', () => {
  it('should build valid code frame for errors while evaling styles', () => {
    expect(() => {
      transpile(dedent`
      const test = () => {
        throw new Error("Some weird error");
      };

      function m() {
        test();
      }

      const header = css\`color: ${'${m()}'};\`;
      `);
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
      transpile(dedent`
      const utils = require("./src/babel/__integration-tests__/__fixtures__/commonjs/utils.js");

      const header = css\`color: ${'${utils.throw()}'};\`;
      `);
    }).toThrowErrorMatchingSnapshot();
  });
});
