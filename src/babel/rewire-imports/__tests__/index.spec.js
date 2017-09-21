/* eslint-disable no-template-curly-in-string */
/* @flow */

import * as babel from 'babel-core';
import path from 'path';

function transpile(source, pluginOptions = {}, options = {}) {
  return babel.transform(source, {
    presets: ['es2015', 'stage-3'],
    plugins: [[path.resolve('src/babel/rewire-imports'), pluginOptions]],
    babelrc: false,
    ...options,
  });
}

describe('rewire-imports babel plugin', () => {
  it('should throw error if there is a CJS import to linaria', () => {
    expect(() => {
      transpile(`
        const linaria = require('linaria');
      `);
    }).toThrowError();
  });

  it('should not throw error if the CJS import is already rewired', () => {
    expect(() => {
      transpile(`
        const linaria = require('linaria/build/index.runtime.js');
      `);
    }).not.toThrowError();
  });

  it('should rewire ESM import to linaria', () => {
    const { code } = transpile(`
      import { names } from 'linaria';
    `);

    expect(code).toMatch(`require('linaria/build/index.runtime.js')`);
  });

  it('should do nothing if ESM import to linaria is already rewired', () => {
    const { code } = transpile(`
      import { names } from 'linaria/build/index.runtime.js';
    `);

    expect(code).toMatch(`require('linaria/build/index.runtime.js')`);
  });

  it('should skip rewiring if the import is inside prevaled source', () => {
    const { code } = transpile(`
      /* linaria-preval */
      import { names } from 'linaria';
    `);

    expect(code).toMatch(`require('linaria')`);
  });
});
