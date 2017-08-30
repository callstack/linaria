import path from 'path';
import fs from 'fs';
import { types } from 'babel-core';
import extractStyles, { clearCache } from '../extractStyles';
import sheet from '../../../sheet';

jest.mock('../../../sheet');
jest.mock('fs');

describe('extractStyles module from preval-extract babel plugin', () => {
  it('should not do anything if there is no styles', () => {
    sheet.dump.mockImplementationOnce(() => '');
    const writeFileSync = jest.fn();

    extractStyles(types, null, '', {}, { writeFileSync });

    sheet.dump.mockImplementationOnce(() => '');
    extractStyles(types, null, '', {});

    expect(writeFileSync).not.toHaveBeenCalled();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should skip extraction if extract option is false', () => {
    sheet.dump.mockImplementationOnce(() => '...');
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
      sheet.dump.mockImplementationOnce(() => '.classname{color: #ffffff}');
      const writeFileSync = jest.fn();

      const program = {
        node: {
          body: [],
        },
      };
      extractStyles(
        types,
        program,
        'filename.js',
        { single: true, cache: false },
        { writeFileSync }
      );

      expect(writeFileSync).toHaveBeenCalledTimes(1);
      expect(writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), 'filename.css')
      );
      expect(writeFileSync.mock.calls[0][1]).toMatchSnapshot();
      expect(program.node.body.length).toBe(0);
    });

    it('should write (and overwrite) new styles to a file', () => {
      sheet.dump.mockImplementationOnce(() => '.classname{color: #ffffff}');
      const writeFileSync = jest.fn();

      const program = {
        node: {
          body: [],
        },
      };

      extractStyles(
        types,
        program,
        path.join(process.cwd(), 'filename.js'),
        { cache: false },
        { writeFileSync }
      );

      sheet.dump.mockImplementationOnce(() => '.classname{color: #000000}');
      // On each transpilation the body does not contain require call added by extractStyles
      program.node.body = [];

      extractStyles(
        types,
        program,
        path.join(process.cwd(), 'filename.js'),
        { cache: false },
        { writeFileSync }
      );

      expect(writeFileSync).toHaveBeenCalledTimes(2);
      expect(writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), 'filename.css')
      );
      expect(writeFileSync.mock.calls[0][1]).toMatchSnapshot();
      expect(program.node.body.length).toBe(1);
    });
  });

  describe('with cache enabled', () => {
    beforeEach(clearCache);

    it('should write only once if the file has not changed', () => {
      sheet.dump.mockImplementationOnce(() => '.classname{color: #ffffff}');
      const writeFileSync = jest.fn();

      const program = {
        node: {
          body: [],
        },
      };

      extractStyles(
        types,
        program,
        'filename.js',
        { filename: 'A.css' },
        { writeFileSync }
      );

      sheet.dump.mockImplementationOnce(() => '.classname{color: #ffffff}');

      extractStyles(
        types,
        program,
        'filename.js',
        { filename: 'A.css' },
        { writeFileSync }
      );

      expect(writeFileSync).toHaveBeenCalledTimes(1);
      expect(writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), 'A.css')
      );
      expect(writeFileSync.mock.calls[0][1]).toMatchSnapshot();
      expect(program.node.body.length).toBe(1);
    });

    it('should overwrite if the file has changed', () => {
      sheet.dump.mockImplementationOnce(() => '.classname{color: #ffffff}');
      const writeFileSync = jest.fn();

      const program = {
        node: {
          body: [],
        },
      };

      extractStyles(
        types,
        program,
        'filename.js',
        { outDir: process.cwd(), filename: '[name].css' },
        { writeFileSync }
      );

      sheet.dump.mockImplementationOnce(() => '.classname{color: #000000}');
      // On each transpilation the body does not contain require call added by extractStyles
      program.node.body = [];

      extractStyles(
        types,
        program,
        'filename.js',
        { outDir: process.cwd(), filename: '[name].css' },
        { writeFileSync }
      );

      expect(writeFileSync).toHaveBeenCalledTimes(2);
      expect(writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), 'filename.css')
      );
      expect(writeFileSync.mock.calls[0][1]).toMatch('#ffffff');
      expect(writeFileSync.mock.calls[0][1]).toMatchSnapshot();
      expect(writeFileSync.mock.calls[1][0]).toEqual(
        path.join(process.cwd(), 'filename.css')
      );
      expect(writeFileSync.mock.calls[1][1]).toMatch('#000000');
      expect(writeFileSync.mock.calls[1][1]).toMatchSnapshot();
      expect(program.node.body.length).toBe(1);
    });

    it('should append styles only once if the file has not changed', () => {
      sheet.dump.mockImplementationOnce(() => '.classname{color: #ffffff}');
      const writeFileSync = jest.fn();

      extractStyles(
        types,
        null,
        'filename.js',
        { single: true },
        { writeFileSync }
      );

      sheet.dump.mockImplementationOnce(() => '.classname{color: #ffffff}');

      extractStyles(
        types,
        null,
        'filename.js',
        { single: true },
        { writeFileSync }
      );

      expect(writeFileSync).toHaveBeenCalledTimes(1);
      expect(writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), 'filename.css')
      );
      expect(writeFileSync.mock.calls[0][1]).toMatch(
        '.classname{color: #ffffff}'
      );
      expect(writeFileSync.mock.calls[0][1]).toMatchSnapshot();
    });

    it('should overwrite css if the file has changed', () => {
      sheet.dump.mockImplementationOnce(() => '.classname{color: #ffffff}');
      const writeFileSync = jest.fn();

      extractStyles(
        types,
        null,
        'filename.js',
        { single: true },
        { writeFileSync }
      );

      sheet.dump.mockImplementationOnce(() => '.classname{color: #000000}');

      extractStyles(
        types,
        null,
        'filename.js',
        { single: true },
        { writeFileSync }
      );

      expect(writeFileSync).toHaveBeenCalledTimes(2);
      expect(writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), 'filename.css')
      );
      expect(writeFileSync.mock.calls[0][1]).toMatch(
        '.classname{color: #ffffff}'
      );
      expect(writeFileSync.mock.calls[0][1]).toMatchSnapshot();
      expect(writeFileSync.mock.calls[1][0]).toEqual(
        path.join(process.cwd(), 'filename.css')
      );
      expect(writeFileSync.mock.calls[1][1]).toMatch(
        '.classname{color: #000000}'
      );
      expect(writeFileSync.mock.calls[1][1]).toMatchSnapshot();
    });

    it('should overwrite css if the new file was added', () => {
      sheet.dump.mockImplementationOnce(() => '.classname{color: #ffffff}');
      const writeFileSync = jest.fn();

      extractStyles(
        types,
        null,
        'filename1.js',
        { single: true },
        { writeFileSync }
      );

      sheet.dump.mockImplementationOnce(() => '.classname{color: #000000}');

      extractStyles(
        types,
        null,
        'filename2.js',
        { single: true },
        { writeFileSync }
      );

      expect(writeFileSync).toHaveBeenCalledTimes(2);
      expect(writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), 'filename1.css')
      );
      expect(writeFileSync.mock.calls[0][1]).toMatch(
        '.classname{color: #ffffff}'
      );
      expect(writeFileSync.mock.calls[0][1]).toMatchSnapshot();
      expect(writeFileSync.mock.calls[1][0]).toEqual(
        path.join(process.cwd(), 'filename2.css')
      );
      expect(writeFileSync.mock.calls[1][1]).toMatch(
        '.classname{color: #ffffff}'
      );
      expect(writeFileSync.mock.calls[1][1]).toMatch(
        '.classname{color: #000000}'
      );
      expect(writeFileSync.mock.calls[1][1]).toMatchSnapshot();
    });
  });
});
