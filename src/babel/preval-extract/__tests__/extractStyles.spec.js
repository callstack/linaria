import path from 'path';
import fs from 'fs';
import { types } from 'babel-core';
import extractStyles, { clearCache } from '../extractStyles';
import { getCachedModule } from '../../lib/moduleSystem';

jest.mock('../../lib/moduleSystem');
jest.mock('fs');

const getCachedModuleImpl = returnValue => () => ({
  exports: {
    default: {
      dump() {
        return returnValue;
      },
    },
  },
});

describe('preval-extract/extractStyles module', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should not do anything if there is no styles', () => {
    getCachedModule.mockImplementationOnce(getCachedModuleImpl(''));

    extractStyles(types, null, 'test.js', {});

    getCachedModule.mockImplementationOnce(getCachedModuleImpl(''));
    extractStyles(types, null, 'test.js', {});

    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should not do anything if sheet module is not found in cache', () => {
    getCachedModule.mockImplementationOnce(() => null);

    extractStyles(types, null, 'test.js', {});

    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should skip extraction if extract option is false', () => {
    getCachedModule.mockImplementationOnce(getCachedModuleImpl('...'));
    const writeFileSync = jest.fn();

    extractStyles(
      types,
      null,
      'filename.js',
      { extract: false },
      { writeFileSync }
    );

    expect(writeFileSync).not.toHaveBeenCalled();
  });

  describe('with cache disabled', () => {
    beforeEach(clearCache);

    it('should append new styles to a file', () => {
      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #ffffff}')
      );

      const program = {
        node: {
          body: [],
        },
      };
      extractStyles(types, program, 'filename.js', {
        single: true,
        cache: false,
      });

      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), 'filename.css')
      );
      expect(fs.writeFileSync.mock.calls[0][1]).toMatchSnapshot();
      expect(program.node.body.length).toBe(0);
    });

    it('should write (and overwrite) new styles to a file', () => {
      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #ffffff}')
      );

      const program = {
        node: {
          body: [],
        },
      };

      extractStyles(types, program, path.join(process.cwd(), 'filename.js'), {
        cache: false,
      });

      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #000000}')
      );
      // On each transpilation the body does not contain require call added by extractStyles
      program.node.body = [];

      extractStyles(types, program, path.join(process.cwd(), 'filename.js'), {
        cache: false,
      });

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(fs.writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), 'filename.css')
      );
      expect(fs.writeFileSync.mock.calls[0][1]).toMatchSnapshot();
      expect(program.node.body.length).toBe(1);
    });
  });

  describe('with cache enabled', () => {
    beforeEach(clearCache);

    it('should write only once if the file has not changed', () => {
      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #ffffff}')
      );

      const program = {
        node: {
          body: [],
        },
      };

      extractStyles(types, program, 'filename.js', { filename: 'A.css' });

      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #ffffff}')
      );
      // On each transpilation the body does not contain require call added by extractStyles
      program.node.body = [];

      extractStyles(types, program, 'filename.js', { filename: 'A.css' });

      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), 'A.css')
      );
      expect(fs.writeFileSync.mock.calls[0][1]).toMatchSnapshot();
      expect(program.node.body.length).toBe(1);
    });

    it('should append classnames when writing to single file', () => {
      const writeFileSync = jest.fn();
      const opts = { single: true, filename: 'A.css' };

      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #ffffff}')
      );

      extractStyles(types, null, 'file1.js', opts, { writeFileSync });

      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.other{color: #000000}')
      );

      extractStyles(types, null, 'file2.js', opts, { writeFileSync });

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(fs.writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), 'A.css')
      );
      expect(fs.writeFileSync.mock.calls[0][1]).toMatch(
        '.classname{color: #ffffff}'
      );
      expect(fs.writeFileSync.mock.calls[1][0]).toEqual(
        path.join(process.cwd(), 'A.css')
      );
      expect(fs.writeFileSync.mock.calls[1][1]).toMatch(
        '.classname{color: #ffffff}\n.other{color: #000000}'
      );
    });

    it('should overwrite if the file has changed', () => {
      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #ffffff}')
      );

      const program = {
        node: {
          body: [],
        },
      };

      extractStyles(types, program, 'filename.js', {
        outDir: process.cwd(),
        filename: '[name].css',
      });

      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #000000}')
      );
      // On each transpilation the body does not contain require call added by extractStyles
      program.node.body = [];

      extractStyles(types, program, 'filename.js', {
        outDir: process.cwd(),
        filename: '[name].css',
      });

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(fs.writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), 'filename.css')
      );
      expect(fs.writeFileSync.mock.calls[0][1]).toMatch('#ffffff');
      expect(fs.writeFileSync.mock.calls[0][1]).toMatchSnapshot();
      expect(fs.writeFileSync.mock.calls[1][0]).toEqual(
        path.join(process.cwd(), 'filename.css')
      );
      expect(fs.writeFileSync.mock.calls[1][1]).toMatch('#000000');
      expect(fs.writeFileSync.mock.calls[1][1]).toMatchSnapshot();
      expect(program.node.body.length).toBe(1);
    });

    it('should append styles only once if the file has not changed', () => {
      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #ffffff}')
      );

      extractStyles(types, null, 'filename.js', { single: true });

      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #ffffff}')
      );

      extractStyles(types, null, 'filename.js', { single: true });

      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), 'filename.css')
      );
      expect(fs.writeFileSync.mock.calls[0][1]).toMatch(
        '.classname{color: #ffffff}'
      );
      expect(fs.writeFileSync.mock.calls[0][1]).toMatchSnapshot();
    });

    it('should overwrite css if the file has changed', () => {
      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #ffffff}')
      );
      const writeFileSync = jest.fn();

      extractStyles(
        types,
        null,
        'filename.js',
        { single: true },
        { writeFileSync }
      );

      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #000000}')
      );

      extractStyles(
        types,
        null,
        'filename.js',
        { single: true },
        { writeFileSync }
      );

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(fs.writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), 'filename.css')
      );
      expect(fs.writeFileSync.mock.calls[0][1]).toMatch(
        '.classname{color: #ffffff}'
      );
      expect(fs.writeFileSync.mock.calls[0][1]).toMatchSnapshot();
      expect(fs.writeFileSync.mock.calls[1][0]).toEqual(
        path.join(process.cwd(), 'filename.css')
      );
      expect(fs.writeFileSync.mock.calls[1][1]).toMatch(
        '.classname{color: #000000}'
      );
      expect(fs.writeFileSync.mock.calls[1][1]).toMatchSnapshot();
    });

    it('should overwrite css if the new file was added', () => {
      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #ffffff}')
      );
      const writeFileSync = jest.fn();

      extractStyles(
        types,
        null,
        'filename1.js',
        { single: true },
        { writeFileSync }
      );

      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #000000}')
      );

      extractStyles(
        types,
        null,
        'filename2.js',
        { single: true },
        { writeFileSync }
      );

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(fs.writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), 'filename1.css')
      );
      expect(fs.writeFileSync.mock.calls[0][1]).toMatch(
        '.classname{color: #ffffff}'
      );
      expect(fs.writeFileSync.mock.calls[0][1]).toMatchSnapshot();
      expect(fs.writeFileSync.mock.calls[1][0]).toEqual(
        path.join(process.cwd(), 'filename2.css')
      );
      expect(fs.writeFileSync.mock.calls[1][1]).toMatch(
        '.classname{color: #ffffff}'
      );
      expect(fs.writeFileSync.mock.calls[1][1]).toMatch(
        '.classname{color: #000000}'
      );
      expect(fs.writeFileSync.mock.calls[1][1]).toMatchSnapshot();
    });
  });
});
