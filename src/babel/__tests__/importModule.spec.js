jest.mock('babel-core');

import * as babel from 'babel-core';
import importModule from '../importModule';

describe('babel/importModule', () => {
  it('should return null if import statement was not found', () => {
    expect(importModule('module', [], '')).toBeNull();
  });

  it('should throw an error if source source file for import was not found', () => {
    expect(() => {
      importModule('module', [{ name: 'module' }], '');
    }).toThrowError(/Could not find require statement/);
  });

  it('should throw an error if imported file does not export an object', () => {
    babel.transformFileSync.mockImplementation(() => ({ code: '' }));
    expect(() => {
      importModule('module', [{ name: 'module', sourceFile: 'module' }], '');
    }).toThrowError(/must export an object/);
  });

  it('should resolve source file and import it', () => {
    babel.transformFileSync.mockImplementation(() => ({
      code: 'module.exports = { var1: "var1", var2: "var2" }',
    }));
    expect(
      importModule(
        'module',
        [
          { name: 'module', sourceFrom: '_module' },
          { name: '_module', sourceFile: '_module' },
        ],
        ''
      )
    ).toEqual({ var1: 'var1', var2: 'var2' });
  });
});
