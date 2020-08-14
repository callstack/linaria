import path from 'path';
import dedent from 'dedent';
import * as babel from '@babel/core';
import Module from '../babel/module';
import type { Evaluator, StrictOptions } from '../babel/types';

beforeEach(() => Module.invalidate());

const evaluator: Evaluator = (filename, options, text) => {
  const { code } = babel.transformSync(text, {
    filename: filename,
  })!;
  return [code!, null];
};

function getFileName() {
  return path.resolve(__dirname, `../__fixtures__/test.js`);
}

const options: StrictOptions = {
  displayName: false,
  evaluate: true,
  rules: [
    {
      action: evaluator,
    },
    {
      test: /\/node_modules\//,
      action: 'ignore',
    },
  ],
  babelOptions: {},
};

beforeEach(() => Module.invalidateEvalCache());

it('creates module for JS files', () => {
  const filename = '/foo/bar/test.js';
  const mod = new Module(filename, options);

  mod.evaluate('module.exports = () => 42');

  expect(mod.exports()).toBe(42);
  expect(mod.id).toBe(filename);
  expect(mod.filename).toBe(filename);
});

it('requires JS files', () => {
  const mod = new Module(getFileName(), options);

  mod.evaluate(dedent`
    const answer = require('./sample-script');

    module.exports = 'The answer is ' + answer;
  `);

  expect(mod.exports).toBe('The answer is 42');
});

it('requires JSON files', () => {
  const mod = new Module(getFileName(), options);

  mod.evaluate(dedent`
    const data = require('./sample-data.json');

    module.exports = 'Our saviour, ' + data.name;
  `);

  expect(mod.exports).toBe('Our saviour, Luke Skywalker');
});

it('imports JS files', () => {
  const mod = new Module(getFileName(), options);

  mod.evaluate(dedent`
    import answer from './sample-script';

    export const result = 'The answer is ' + answer;
  `);

  expect(mod.exports.result).toBe('The answer is 42');
});

it('imports TypeScript files', () => {
  const mod = new Module(
    path.resolve(__dirname, '../__fixtures__/test.ts'),
    options
  );

  mod.evaluate(dedent`
    import answer from './sample-typescript';

    export const result = 'The answer is ' + answer;
  `);

  expect(mod.exports.result).toBe('The answer is 27');
});

it('imports JSON files', () => {
  const mod = new Module(getFileName(), options);

  mod.evaluate(dedent`
    import data from './sample-data.json';

    const result = 'Our saviour, ' + data.name;

    export default result;
  `);

  expect(mod.exports.default).toBe('Our saviour, Luke Skywalker');
});

it('returns module from the cache', () => {
  /* eslint-disable no-self-compare */

  const filename = getFileName();
  const mod = new Module(filename, options);
  const id = './sample-data.json';

  expect(mod.require(id) === mod.require(id)).toBe(true);

  expect(
    new Module(filename, options).require(id) ===
      new Module(filename, options).require(id)
  ).toBe(true);
});

it('clears modules from the cache', () => {
  const filename = getFileName();
  const id = './sample-data.json';

  const result = new Module(filename, options).require(id);

  expect(result === new Module(filename, options).require(id)).toBe(true);

  Module.invalidate();

  expect(result === new Module(filename, options).require(id)).toBe(false);
});

it('exports the path for non JS/JSON files', () => {
  const mod = new Module(getFileName(), options);

  expect(mod.require('./sample-asset.png')).toBe('./sample-asset.png');
});

it('returns module when requiring mocked builtin node modules', () => {
  const mod = new Module(getFileName(), options);

  expect(mod.require('path')).toBe(require('path'));
});

it('returns null when requiring empty builtin node modules', () => {
  const mod = new Module(getFileName(), options);

  expect(mod.require('fs')).toBe(null);
});

it('throws when requiring unmocked builtin node modules', () => {
  const mod = new Module(getFileName(), options);

  expect(() => mod.require('perf_hooks')).toThrow(
    'Unable to import "perf_hooks". Importing Node builtins is not supported in the sandbox.'
  );
});

it('has access to the global object', () => {
  const mod = new Module(getFileName(), options);

  expect(() =>
    mod.evaluate(dedent`
    new global.Set();
  `)
  ).not.toThrow();
});

it("doesn't have access to the process object", () => {
  const mod = new Module(getFileName(), options);

  expect(() =>
    mod.evaluate(dedent`
    module.exports = process.abort();
  `)
  ).toThrow('process.abort is not a function');
});

it('has access to NODE_ENV', () => {
  const mod = new Module(getFileName(), options);

  mod.evaluate(dedent`
  module.exports = process.env.NODE_ENV;
  `);

  expect(mod.exports).toBe(process.env.NODE_ENV);
});

it('has require.resolve available', () => {
  const mod = new Module(getFileName(), options);

  mod.evaluate(dedent`
  module.exports = require.resolve('./sample-script');
  `);

  expect(mod.exports).toBe(
    path.resolve(path.dirname(mod.filename), 'sample-script.js')
  );
});

it('has require.ensure available', () => {
  const mod = new Module(getFileName(), options);

  expect(() =>
    mod.evaluate(dedent`
  require.ensure(['./sample-script']);
  `)
  ).not.toThrow();
});

it('has __filename available', () => {
  const mod = new Module(getFileName(), options);

  mod.evaluate(dedent`
  module.exports = __filename;
  `);

  expect(mod.exports).toBe(mod.filename);
});

it('has __dirname available', () => {
  const mod = new Module(getFileName(), options);

  mod.evaluate(dedent`
  module.exports = __dirname;
  `);

  expect(mod.exports).toBe(path.dirname(mod.filename));
});

it('has setTimeout, clearTimeout available', () => {
  const mod = new Module(getFileName(), options);

  expect(() =>
    mod.evaluate(dedent`
  const x = setTimeout(() => {
    console.log('test');
  },0);

  clearTimeout(x);
  `)
  ).not.toThrow();
});

it('has setInterval, clearInterval available', () => {
  const mod = new Module(getFileName(), options);

  expect(() =>
    mod.evaluate(dedent`
  const x = setInterval(() => {
    console.log('test');
  }, 1000);

  clearInterval(x);
  `)
  ).not.toThrow();
});

it('has setImmediate, clearImmediate available', () => {
  const mod = new Module(getFileName(), options);

  expect(() =>
    mod.evaluate(dedent`
  const x = setImmediate(() => {
    console.log('test');
  });

  clearImmediate(x);
  `)
  ).not.toThrow();
});

it('has global objects available without referencing global', () => {
  const mod = new Module(getFileName(), options);

  expect(() =>
    mod.evaluate(dedent`
  const x = new Set();
  `)
  ).not.toThrow();
});

it('changes resolve behaviour on overriding _resolveFilename', () => {
  const originalResolveFilename = Module._resolveFilename;

  Module._resolveFilename = (id) => (id === 'foo' ? 'bar' : id);

  const mod = new Module(getFileName(), options);

  mod.evaluate(dedent`
  module.exports = [
    require.resolve('foo'),
    require.resolve('test'),
  ];
  `);

  // Restore old behavior
  Module._resolveFilename = originalResolveFilename;

  expect(mod.exports).toEqual(['bar', 'test']);
});

it('correctly processes export declarations in strict mode', () => {
  const filename = '/foo/bar/test.js';
  const mod = new Module(filename, options);

  mod.evaluate('"use strict"; exports = module.exports = () => 42');

  expect(mod.exports()).toBe(42);
  expect(mod.id).toBe(filename);
  expect(mod.filename).toBe(filename);
});
