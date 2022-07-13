import path from 'path';

import * as babel from '@babel/core';
import dedent from 'dedent';

import { Module } from '@linaria/babel-preset';
import type { Evaluator, StrictOptions } from '@linaria/utils';

beforeEach(() => Module.invalidate());

const evaluator: Evaluator = (filename, options, text) => {
  const { code } = babel.transformSync(text, {
    filename,
    presets: ['@babel/preset-env'],
  })!;
  return [code!, null];
};

function getFileName() {
  return path.resolve(__dirname, './__fixtures__/test.js');
}

const options: StrictOptions = {
  displayName: false,
  evaluate: true,
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
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

function createModule(
  filename: string,
  opts: StrictOptions,
  evalCache: Map<string, Module> = new Map()
) {
  return new Module(filename, opts, new Map(), new Map(), evalCache);
}

it('creates module for JS files', () => {
  const filename = '/foo/bar/test.js';
  const mod = createModule(filename, options);

  mod.evaluate('module.exports = () => 42');

  expect((mod.exports as any)()).toBe(42);
  expect(mod.id).toBe(filename);
  expect(mod.filename).toBe(filename);
});

it('requires JS files', () => {
  const mod = createModule(getFileName(), options);

  mod.evaluate(dedent`
    const answer = require('./sample-script');

    module.exports = 'The answer is ' + answer;
  `);

  expect(mod.exports).toBe('The answer is 42');
});

it('requires JSON files', () => {
  const mod = createModule(getFileName(), options);

  mod.evaluate(dedent`
    const data = require('./sample-data.json');

    module.exports = 'Our saviour, ' + data.name;
  `);

  expect(mod.exports).toBe('Our saviour, Luke Skywalker');
});

it('returns module from the cache', () => {
  const filename = getFileName();
  const cache = new Map<string, Module>();
  const mod = createModule(filename, options, cache);
  const id = './sample-data.json';

  expect(mod.require(id)).toBe(mod.require(id));

  const res1 = createModule(filename, options, cache).require(id);
  const res2 = createModule(filename, options, cache).require(id);

  expect(res1).toBe(res2);
});

it('clears modules from the cache', () => {
  const filename = getFileName();
  const cache = new Map<string, Module>();
  const id = './sample-data.json';

  const result = createModule(filename, options, cache).require(id);

  expect(createModule(filename, options, cache).require(id)).toBe(result);

  cache.clear();

  expect(createModule(filename, options, cache).require(id)).not.toBe(result);
});

it('exports the path for non JS/JSON files', () => {
  const mod = createModule(getFileName(), options);

  expect(mod.require('./sample-asset.png')).toBe(
    path.join(__dirname, '__fixtures__', 'sample-asset.png')
  );
});

it('returns module when requiring mocked builtin node modules', () => {
  const mod = createModule(getFileName(), options);

  expect(mod.require('path')).toBe(require('path'));
});

it('returns null when requiring empty builtin node modules', () => {
  const mod = createModule(getFileName(), options);

  expect(mod.require('fs')).toBe(null);
});

it('throws when requiring unmocked builtin node modules', () => {
  const mod = createModule(getFileName(), options);

  expect(() => mod.require('perf_hooks')).toThrow(
    'Unable to import "perf_hooks". Importing Node builtins is not supported in the sandbox.'
  );
});

it('has access to the global object', () => {
  const mod = createModule(getFileName(), options);

  expect(() =>
    mod.evaluate(dedent`
    new global.Set();
  `)
  ).not.toThrow();
});

it("doesn't have access to the process object", () => {
  const mod = createModule(getFileName(), options);

  expect(() =>
    mod.evaluate(dedent`
    module.exports = process.abort();
  `)
  ).toThrow('process.abort is not a function');
});

it('has access to NODE_ENV', () => {
  const mod = createModule(getFileName(), options);

  mod.evaluate(dedent`
  module.exports = process.env.NODE_ENV;
  `);

  expect(mod.exports).toBe(process.env.NODE_ENV);
});

it('has require.resolve available', () => {
  const mod = createModule(getFileName(), options);

  mod.evaluate(dedent`
  module.exports = require.resolve('./sample-script');
  `);

  expect(mod.exports).toBe(
    path.resolve(path.dirname(mod.filename), 'sample-script.js')
  );
});

it('has require.ensure available', () => {
  const mod = createModule(getFileName(), options);

  expect(() =>
    mod.evaluate(dedent`
  require.ensure(['./sample-script']);
  `)
  ).not.toThrow();
});

it('has __filename available', () => {
  const mod = createModule(getFileName(), options);

  mod.evaluate(dedent`
  module.exports = __filename;
  `);

  expect(mod.exports).toBe(mod.filename);
});

it('has __dirname available', () => {
  const mod = createModule(getFileName(), options);

  mod.evaluate(dedent`
  module.exports = __dirname;
  `);

  expect(mod.exports).toBe(path.dirname(mod.filename));
});

it('has setTimeout, clearTimeout available', () => {
  const mod = createModule(getFileName(), options);

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
  const mod = createModule(getFileName(), options);

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
  const mod = createModule(getFileName(), options);

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
  const mod = createModule(getFileName(), options);

  expect(() =>
    mod.evaluate(dedent`
  const x = new Set();
  `)
  ).not.toThrow();
});

it('changes resolve behaviour on overriding _resolveFilename', () => {
  const originalResolveFilename = Module._resolveFilename;

  Module._resolveFilename = (id) => (id === 'foo' ? 'bar' : id);

  const mod = createModule(getFileName(), options);

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
  const mod = createModule(filename, options);

  mod.evaluate('"use strict"; exports = module.exports = () => 42');

  expect((mod.exports as any)()).toBe(42);
  expect(mod.id).toBe(filename);
  expect(mod.filename).toBe(filename);
});
