/* eslint-disable no-template-curly-in-string */
/* @flow */

import * as babel from 'babel-core';
import path from 'path';

function transpile(source, pluginOptions = {}, options = {}) {
  return babel.transform(source, {
    presets: ['env', 'stage-2'],
    plugins: [[path.resolve('src/babel/rewire-imports'), pluginOptions]],
    babelrc: false,
    ...options,
  });
}

describe('rewire-imports babel plugin', () => {
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

  it('should rewire CJS require to linaria', () => {
    const { code } = transpile(`
      const linaria = require('linaria');
    `);

    expect(code).toMatch(`require('linaria/build/index.runtime.js')`);
  });

  it('should rewire CJS require with ternary to linaria', () => {
    const { code: consequent } = transpile(`
      const linaria = require(dev ? 'linaria' : 'something');
    `);
    const { code: alternate } = transpile(`
      const linaria = require(dev ? 'something' : 'linaria');
    `);

    expect(consequent).toMatch(
      `require(dev ? 'linaria/build/index.runtime.js' : 'something')`
    );
    expect(alternate).toMatch(
      `require(dev ? 'something' : 'linaria/build/index.runtime.js')`
    );
  });

  it('should do nothing if CJS require is already rewired', () => {
    const { code } = transpile(`
    const linaria = require('linaria/build/index.runtime.js');
    `);

    expect(code).toMatch(`require('linaria/build/index.runtime.js')`);
  });

  it('should not rewire a member expression require to linaria', () => {
    const { code } = transpile(`
      const linaria = test.require('linaria');
    `);

    expect(code).toMatch(`test.require('linaria')`);
  });

  it('should skip rewiring if the require is inside prevaled source', () => {
    const { code } = transpile(`
      /* linaria-preval */
      const linaria = require('linaria');
    `);

    expect(code).toMatch(`require('linaria')`);
  });
});
