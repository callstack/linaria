import path from 'path';

import dedent from 'dedent';

import {
  DefaultModuleImplementation,
  Module,
  TransformCacheCollection,
} from '@linaria/babel-preset';
import type { StrictOptions } from '@linaria/utils';

function getFileName() {
  return path.resolve(__dirname, './__fixtures__/test.js');
}

const options: StrictOptions = {
  displayName: false,
  evaluate: true,
  extensions: ['.cjs', '.js', '.jsx', '.ts', '.tsx'],
  rules: [],
  babelOptions: {},
  features: {
    dangerousCodeRemover: true,
  },
  highPriorityPlugins: [],
};

it('creates module for JS files', () => {
  const filename = '/foo/bar/test.js';
  const mod = new Module(filename, options);

  mod.evaluate('module.exports = () => 42');

  expect((mod.exports as any)()).toBe(42);
  expect(mod.id).toBe(filename);
  expect(mod.filename).toBe(filename);
});

it('requires .js files', () => {
  const mod = new Module(getFileName(), options);

  mod.evaluate(dedent`
    const answer = require('./sample-script');

    module.exports = 'The answer is ' + answer;
  `);

  expect(mod.exports).toBe('The answer is 42');
});

it('requires .cjs files', () => {
  const mod = new Module(getFileName(), options);

  mod.evaluate(dedent`
    const answer = require('./sample-script.cjs');

    module.exports = 'The answer is ' + answer;
  `);

  expect(mod.exports).toBe('The answer is 42');
});

it('requires .json files', () => {
  const mod = new Module(getFileName(), options);

  mod.evaluate(dedent`
    const data = require('./sample-data.json');

    module.exports = 'Our saviour, ' + data.name;
  `);

  expect(mod.exports).toBe('Our saviour, Luke Skywalker');
});

it('returns module from the cache', () => {
  const filename = getFileName();
  const cache = new TransformCacheCollection();
  const mod = new Module(filename, options, cache);
  const id = './sample-data.json';

  expect(mod.require(id)).toBe(mod.require(id));

  const res1 = new Module(filename, options, cache).require(id);
  const res2 = new Module(filename, options, cache).require(id);

  expect(res1).toBe(res2);
});

it('should use cached version from the codeCache', () => {
  const filename = getFileName();
  const cache = new TransformCacheCollection();
  const mod = new Module(filename, options, cache);
  const resolved = require.resolve('./__fixtures__/objectExport.js');

  cache.resolveCache.set(
    `${filename} -> ./objectExport`,
    `${resolved}\0margin`
  );

  cache.codeCache.set(resolved, {
    only: ['margin'],
    imports: null,
    result: {
      code: 'module.exports = { margin: 1 };',
    },
  });

  mod.evaluate(dedent`
    const margin = require('./objectExport').margin;

    module.exports = 'Imported value is ' + margin;
  `);

  expect(mod.exports).toBe('Imported value is 1');
});

it('should reread module from disk when it is in codeCache but not in resolveCache', () => {
  // This may happen when the current importer was not processed, but required
  // module was already required by another module, and its code was cached.
  // In this case, we should not use the cached code, but reread the file.

  const filename = getFileName();
  const cache = new TransformCacheCollection();
  const mod = new Module(filename, options, cache);
  const resolved = require.resolve('./__fixtures__/objectExport.js');

  cache.codeCache.set(resolved, {
    only: ['margin'],
    imports: null,
    result: {
      code: 'module.exports = { margin: 1 };',
    },
  });

  mod.evaluate(dedent`
    const margin = require('./objectExport').margin;

    module.exports = 'Imported value is ' + margin;
  `);

  expect(mod.exports).toBe('Imported value is 5');
});

it('clears modules from the cache', () => {
  const filename = getFileName();
  const cache = new TransformCacheCollection();
  const id = './sample-data.json';

  const result = new Module(filename, options, cache).require(id);

  expect(new Module(filename, options, cache).require(id)).toBe(result);

  cache.evalCache.clear();

  expect(new Module(filename, options, cache).require(id)).not.toBe(result);
});

it('exports the path for non JS/JSON files', () => {
  const mod = new Module(getFileName(), options);

  expect(mod.require('./sample-asset.png')).toBe(
    path.join(__dirname, '__fixtures__', 'sample-asset.png')
  );
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

it('has access to Object prototype methods on `exports`', () => {
  const mod = new Module(getFileName(), options);

  expect(() =>
    mod.evaluate(dedent`
    exports.hasOwnProperty('keyss');
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
  const resolveFilename = jest
    .spyOn(DefaultModuleImplementation, '_resolveFilename')
    .mockImplementation((id) => (id === 'foo' ? 'bar' : id));

  const mod = new Module(getFileName(), options);

  mod.evaluate(dedent`
  module.exports = [
    require.resolve('foo'),
    require.resolve('test'),
  ];
  `);

  expect(mod.exports).toEqual(['bar', 'test']);
  expect(resolveFilename).toHaveBeenCalledTimes(2);

  resolveFilename.mockRestore();
});

it('should resolve from the cache', () => {
  const resolveFilename = jest.spyOn(
    DefaultModuleImplementation,
    '_resolveFilename'
  );

  const cache = new TransformCacheCollection();
  const filename = getFileName();

  cache.resolveCache.set(`${filename} -> foo`, 'resolved foo');
  cache.resolveCache.set(`${filename} -> test`, 'resolved test');

  const mod = new Module(filename, options, cache);

  mod.evaluate(dedent`
  module.exports = [
    require.resolve('foo'),
    require.resolve('test'),
  ];
  `);

  expect(mod.exports).toEqual(['resolved foo', 'resolved test']);
  expect(resolveFilename).toHaveBeenCalledTimes(0);

  resolveFilename.mockRestore();
});

it('correctly processes export declarations in strict mode', () => {
  const filename = '/foo/bar/test.js';
  const mod = new Module(filename, options);

  mod.evaluate('"use strict"; exports = module.exports = () => 42');

  expect((mod.exports as any)()).toBe(42);
  expect(mod.id).toBe(filename);
  expect(mod.filename).toBe(filename);
});

it('export * compiled by typescript to commonjs works', () => {
  const mod = new Module(getFileName(), options);

  mod.evaluate(dedent`
    const { foo } = require('./ts-compiled-re-exports');

    module.exports = foo;
  `);

  expect(mod.exports).toBe('foo');
});
