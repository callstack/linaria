import path from 'path';

import * as babel from '@babel/core';
import dedent from 'dedent';

import type { LoadAndParseFn, Services } from '@linaria/babel-preset';
import {
  DefaultModuleImplementation,
  Entrypoint,
  Module,
  TransformCacheCollection,
} from '@linaria/babel-preset';
import { linariaLogger } from '@linaria/logger';
import type { StrictOptions } from '@linaria/utils';
import { EventEmitter } from '@linaria/utils';

const createServices = (partial: Partial<Services>): Services => {
  const loadAndParseFn: LoadAndParseFn = (services, name, loadedCode) => ({
    ast: services.babel.parseSync(loadedCode ?? '')!,
    code: loadedCode!,
    evaluator: jest.fn(),
    evalConfig: {},
  });

  return {
    babel,
    cache: new TransformCacheCollection(),
    loadAndParseFn,
    log: linariaLogger,
    eventEmitter: EventEmitter.dummy,
    options: {} as Services['options'],
    ...partial,
  };
};

const filename = path.resolve(__dirname, './__fixtures__/test.js');

const options: StrictOptions = {
  displayName: false,
  evaluate: true,
  extensions: ['.cjs', '.js', '.jsx', '.ts', '.tsx'],
  rules: [],
  babelOptions: {},
  features: {
    dangerousCodeRemover: true,
    globalCache: true,
    happyDOM: true,
  },
  highPriorityPlugins: [],
};

const createEntrypoint = (
  name: string,
  only: string[],
  code: string,
  cache: TransformCacheCollection = new TransformCacheCollection()
) => {
  const services = createServices({ cache });
  const entrypoint = Entrypoint.createRoot(services, name, only, code, options);

  if (entrypoint.ignored) {
    throw new Error('entrypoint was ignored');
  }

  return entrypoint;
};

const create = (strings: TemplateStringsArray, ...expressions: unknown[]) => {
  const code = dedent(strings, ...expressions);
  const cache = new TransformCacheCollection();
  const entrypoint = createEntrypoint(filename, ['*'], code, cache);
  const mod = new Module(entrypoint, cache);

  return {
    cache,
    entrypoint,
    mod,
  };
};

it('creates module for JS files', () => {
  const { mod } = create`
    module.exports = () => 42;
  `;

  mod.evaluate();

  expect((mod.exports as any)()).toBe(42);
  expect(mod.id).toBe(filename);
  expect(mod.filename).toBe(filename);
});

it('requires .js files', () => {
  const { mod } = create`
    const answer = require('./sample-script');

    module.exports = 'The answer is ' + answer;
  `;

  mod.evaluate();

  expect(mod.exports).toBe('The answer is 42');
});

it('requires .cjs files', () => {
  const { mod } = create`
    const answer = require('./sample-script.cjs');

    module.exports = 'The answer is ' + answer;
  `;
  mod.evaluate();

  expect(mod.exports).toBe('The answer is 42');
});

it('requires .json files', () => {
  const { mod } = create`
    const data = require('./sample-data.json');

    module.exports = 'Our saviour, ' + data.name;
  `;
  mod.evaluate();

  expect(mod.exports).toBe('Our saviour, Luke Skywalker');
});

it('returns module from the cache', () => {
  const { entrypoint, mod, cache } = create``;

  const id = './sample-data.json';

  expect(mod.require(id)).toBe(mod.require(id));

  const res1 = new Module(entrypoint, cache).require(id);
  const res2 = new Module(entrypoint, cache).require(id);

  expect(res1).toBe(res2);
});

it('should use cached version from the codeCache', () => {
  const { entrypoint, mod } = create`
    const margin = require('./objectExport').margin;

    module.exports = 'Imported value is ' + margin;
  `;

  const resolved = require.resolve('./__fixtures__/objectExport.js');
  entrypoint.addDependency('./objectExport', {
    only: ['margin'],
    resolved,
    source: 'objectExport',
  });

  entrypoint.createChild(
    resolved,
    ['margin'],
    dedent`
      module.exports = { margin: 1 };
    `
  );

  mod.evaluate();

  expect(mod.exports).toBe('Imported value is 1');
});

it('should reread module from disk when it is in codeCache but not in resolveCache', () => {
  // This may happen when the current importer was not processed, but required
  // module was already required by another module, and its code was cached.
  // In this case, we should not use the cached code, but reread the file.

  const { entrypoint, mod } = create`
    const margin = require('./objectExport').margin;

    module.exports = 'Imported value is ' + margin;
  `;

  const resolved = require.resolve('./__fixtures__/objectExport.js');
  entrypoint.createChild(
    resolved,
    ['margin'],
    dedent`
    module.exports = { margin: 1 };
  `
  );

  mod.evaluate();

  expect(mod.exports).toBe('Imported value is 5');
});

it('clears modules from the cache', () => {
  const id = './sample-data.json';

  const { entrypoint, mod, cache } = create``;
  const result = mod.require(id);

  expect(new Module(entrypoint, cache).require(id)).toBe(result);

  const dep = new Module(entrypoint, cache).resolve(id);
  cache.invalidateForFile(dep);

  expect(new Module(entrypoint, cache).require(id)).not.toBe(result);
});

it('exports the path for non JS/JSON files', () => {
  const { mod } = create``;

  expect(mod.require('./sample-asset.png')).toBe(
    path.join(__dirname, '__fixtures__', 'sample-asset.png')
  );
});

it('returns module when requiring mocked builtin node modules', () => {
  const { mod } = create``;

  expect(mod.require('path')).toBe(require('path'));
});

it('returns null when requiring empty builtin node modules', () => {
  const { mod } = create``;

  expect(mod.require('fs')).toBe(null);
});

it('throws when requiring unmocked builtin node modules', () => {
  const { mod } = create``;

  expect(() => mod.require('perf_hooks')).toThrow(
    'Unable to import "perf_hooks". Importing Node builtins is not supported in the sandbox.'
  );
});

it('has access to the global object', () => {
  const { mod } = create`
    new global.Set();
  `;

  expect(() => mod.evaluate()).not.toThrow();
});

it('has access to Object prototype methods on `exports`', () => {
  const { mod } = create`
    exports.hasOwnProperty('keyss');
  `;

  expect(() => mod.evaluate()).not.toThrow();
});

it("doesn't have access to the process object", () => {
  const { mod } = create`
    module.exports = process.abort();
  `;

  expect(() => mod.evaluate()).toThrow('process.abort is not a function');
});

it('has access to NODE_ENV', () => {
  const { mod } = create`
    module.exports = process.env.NODE_ENV;
  `;

  mod.evaluate();

  expect(mod.exports).toBe(process.env.NODE_ENV);
});

it('has require.resolve available', () => {
  const { mod } = create`
    module.exports = require.resolve('./sample-script');
  `;

  mod.evaluate();

  expect(mod.exports).toBe(
    path.resolve(path.dirname(mod.filename), 'sample-script.js')
  );
});

it('has require.ensure available', () => {
  const { mod } = create`
    require.ensure(['./sample-script']);
  `;

  expect(() => mod.evaluate()).not.toThrow();
});

it('changes resolve behaviour on overriding _resolveFilename', () => {
  const resolveFilename = jest
    .spyOn(DefaultModuleImplementation, '_resolveFilename')
    .mockImplementation((id) => (id === 'foo' ? 'bar' : id));

  const { mod } = create`
    module.exports = [
      require.resolve('foo'),
      require.resolve('test'),
    ];
  `;

  mod.evaluate();

  expect(mod.exports).toEqual(['bar', 'test']);
  expect(resolveFilename).toHaveBeenCalledTimes(2);

  resolveFilename.mockRestore();
});

it('should resolve from the cache', () => {
  const resolveFilename = jest.spyOn(
    DefaultModuleImplementation,
    '_resolveFilename'
  );

  const { mod, entrypoint } = create`
    module.exports = [
      require.resolve('foo'),
      require.resolve('test'),
    ];
  `;

  entrypoint.addDependency('foo', {
    only: ['*'],
    resolved: 'resolved foo',
    source: 'foo',
  });
  entrypoint.addDependency('test', {
    only: ['*'],
    resolved: 'resolved test',
    source: 'test',
  });

  mod.evaluate();

  expect(mod.exports).toEqual(['resolved foo', 'resolved test']);
  expect(resolveFilename).toHaveBeenCalledTimes(0);

  resolveFilename.mockRestore();
});

it('correctly processes export declarations in strict mode', () => {
  const { mod } = create`
    "use strict";
    exports = module.exports = () => 42
  `;

  mod.evaluate();

  expect((mod.exports as any)()).toBe(42);
  expect(mod.id).toBe(filename);
  expect(mod.filename).toBe(filename);
});

it('export * compiled by typescript to commonjs works', () => {
  const { mod } = create`
    const { foo } = require('./ts-compiled-re-exports');

    module.exports = foo;
  `;

  mod.evaluate();

  expect(mod.exports).toBe('foo');
});

describe('globals', () => {
  it.each([{ name: 'Timeout' }, { name: 'Interval' }, { name: 'Immediate' }])(
    `has set$name, clear$name available`,
    (i) => {
      const { mod } = create`
        const x = set${i.name}(() => {
          console.log('test');
        },0);

        clear${i.name}(x);
      `;

      expect(() => mod.evaluate()).not.toThrow();
    }
  );

  it('has global objects available without referencing global', () => {
    const { mod } = create`
      const x = new Set();
    `;

    expect(() => mod.evaluate()).not.toThrow();
  });
});

describe('definable globals', () => {
  it('has __filename available', () => {
    const { mod } = create`
      module.exports = __filename;
    `;

    mod.evaluate();

    expect(mod.exports).toBe(mod.filename);
  });

  it('has __dirname available', () => {
    const { mod } = create`
      module.exports = __dirname;
    `;

    mod.evaluate();

    expect(mod.exports).toBe(path.dirname(mod.filename));
  });
});

describe('DOM', () => {
  it('should have DOM globals available', () => {
    const { mod } = create`
      module.exports = {
        document: typeof document,
        window: typeof window,
        global: typeof global,
      };
    `;

    mod.evaluate();

    expect(mod.exports).toEqual({
      document: 'object',
      window: 'object',
      global: 'object',
    });
  });

  it('should have DOM APIs available', () => {
    const { mod } = create`
      const handler = () => {}

      document.addEventListener('click', handler);
      document.removeEventListener('click', handler);

      window.addEventListener('click', handler);
      window.removeEventListener('click', handler);
    `;

    expect(() => mod.evaluate()).not.toThrow();
  });

  it('supports DOM manipulations', () => {
    const { mod } = create`
      const el = document.createElement('div');
      el.setAttribute('id', 'test');

      document.body.appendChild(el);

      module.exports = {
        html: document.body.innerHTML,
        tagName: el.tagName.toLowerCase()
      };
    `;

    mod.evaluate();

    expect(mod.exports).toEqual({
      html: '<div id="test"></div>',
      tagName: 'div',
    });
  });
});
