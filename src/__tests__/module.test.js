/* @flow */

import path from 'path';
import dedent from 'dedent';
import Module from '../babel/module';

beforeEach(() => Module.invalidate());

it('creates module for JS files', () => {
  const filename = '/foo/bar/test.js';
  const mod = new Module(filename);

  mod.evaluate('module.exports = () => 42');

  expect(mod.exports()).toBe(42);
  expect(mod.id).toBe(filename);
  expect(mod.filename).toBe(filename);
  expect(mod.sourceMap).toBeDefined();
});

it('requires JS files', () => {
  const mod = new Module(path.resolve(__dirname, '../__fixtures__/test.js'));

  mod.evaluate(dedent`
    const answer = require('./sample-script');

    module.exports = 'The answer is ' + answer;
  `);

  expect(mod.exports).toBe('The answer is 42');
});

it('requires JSON files', () => {
  const mod = new Module(path.resolve(__dirname, '../__fixtures__/test.js'));

  mod.evaluate(dedent`
    const data = require('./sample-data.json');

    module.exports = 'Our saviour, ' + data.name;
  `);

  expect(mod.exports).toBe('Our saviour, Luke Skywalker');
});

it('imports JS files', () => {
  const mod = new Module(path.resolve(__dirname, '../__fixtures__/test.js'));

  mod.evaluate(dedent`
    import answer from './sample-script';

    export const result = 'The answer is ' + answer;
  `);

  expect(mod.exports.result).toBe('The answer is 42');
});

it('imports JSON files', () => {
  const mod = new Module(path.resolve(__dirname, '../__fixtures__/test.js'));

  mod.evaluate(dedent`
    import data from './sample-data.json';

    const result = 'Our saviour, ' + data.name;

    export default result;
  `);

  expect(mod.exports.default).toBe('Our saviour, Luke Skywalker');
});

it('returns module from the cache', () => {
  /* eslint-disable no-self-compare */

  const filename = path.resolve(__dirname, '../__fixtures__/test.js');
  const mod = new Module(filename);
  const id = './sample-data.json';

  expect(mod.require(id) === mod.require(id)).toBe(true);

  expect(
    new Module(filename).require(id) === new Module(filename).require(id)
  ).toBe(true);
});

it('clears modules from the cache', () => {
  const filename = path.resolve(__dirname, '../__fixtures__/test.js');
  const id = './sample-data.json';

  const result = new Module(filename).require(id);

  expect(result === new Module(filename).require(id)).toBe(true);

  Module.invalidate();

  expect(result === new Module(filename).require(id)).toBe(false);
});

it('exports the path for non JS/JSON files', () => {
  const mod = new Module(path.resolve(__dirname, '../__fixtures__/test.js'));

  expect(mod.require('./sample-asset.png')).toBe(
    path.resolve(__dirname, '../__fixtures__/sample-asset.png')
  );
});

it('throws when requiring native node modules', () => {
  const mod = new Module(path.resolve(__dirname, '../__fixtures__/test.js'));

  expect(() => mod.require('fs')).toThrow(
    'Unable to import "fs". Importing Node builtins is not supported in the sandbox.'
  );
});
