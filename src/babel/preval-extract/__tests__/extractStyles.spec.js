import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import { types } from 'babel-core';
import extractStyles, { clearCache } from '../extractStyles';
import { getCachedModule } from '../../lib/moduleSystem';

jest.mock('../../lib/moduleSystem');
jest.mock('fs');
jest.mock('mkdirp');

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

  it('should create directory structure if needed', () => {
    getCachedModule.mockImplementationOnce(
      getCachedModuleImpl('.classname{color: #ffffff}')
    );

    let calls = 0;
    fs.writeFileSync.mockImplementation(() => {
      if (calls === 0) {
        calls++;
        const error = new Error('ENOENT');
        error.code = 'ENOENT';
        throw error;
      }
    });

    const program = {
      node: {
        body: [],
      },
    };

    extractStyles(types, program, 'filename.js', {
      cache: false,
    });

    expect(mkdirp.sync).toHaveBeenCalledTimes(1);
    expect(mkdirp.sync).toHaveBeenCalledWith(
      path.join(process.cwd(), '.linaria-cache')
    );
  });

  it('should throw error if cannot write to file', () => {
    getCachedModule.mockImplementationOnce(
      getCachedModuleImpl('.classname{color: #ffffff}')
    );

    fs.writeFileSync.mockImplementation(() => {
      const error = new Error('ERR');
      error.code = 'ERR';
      throw error;
    });

    const program = {
      node: {
        body: [],
      },
    };

    expect(() => {
      extractStyles(types, program, 'filename.js', {
        cache: false,
      });
    }).toThrowError();
  });

  describe('with cache disabled', () => {
    beforeEach(clearCache);

    it('with single set to true, should write styles to a file', () => {
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
        path.join(process.cwd(), '.linaria-cache/styles.css')
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
        path.join(process.cwd(), '.linaria-cache/filename.css')
      );
      expect(fs.writeFileSync.mock.calls[0][1]).toMatch(
        '.classname{color: #ffffff}'
      );
      expect(fs.writeFileSync.mock.calls[1][0]).toEqual(
        path.join(process.cwd(), '.linaria-cache/filename.css')
      );
      expect(fs.writeFileSync.mock.calls[1][1]).toMatch(
        '.classname{color: #000000}'
      );
      expect(program.node.body.length).toBe(1);
    });
  });

  describe('with cache enabled', () => {
    beforeEach(clearCache);

    it('should write only once if the styles has not changed', () => {
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
        path.join(process.cwd(), '.linaria-cache/filename.css')
      );
      expect(fs.writeFileSync.mock.calls[0][1]).toMatch(
        '.classname{color: #ffffff}'
      );
      expect(program.node.body.length).toBe(1);
    });

    it('should append classnames when writing to single file', () => {
      const opts = { single: true, filename: 'A.css' };

      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #ffffff}')
      );

      extractStyles(types, null, 'file1.js', opts);

      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.other{color: #000000}')
      );

      extractStyles(types, null, 'file2.js', opts);

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(fs.writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), '.linaria-cache/A.css')
      );
      expect(fs.writeFileSync.mock.calls[0][1]).toMatch(
        '.classname{color: #ffffff}'
      );
      expect(fs.writeFileSync.mock.calls[1][0]).toEqual(
        path.join(process.cwd(), '.linaria-cache/A.css')
      );
      expect(fs.writeFileSync.mock.calls[1][1]).toMatch(
        '.classname{color: #ffffff}\n.other{color: #000000}'
      );
    });

    it('should overwrite if the styles has changed', () => {
      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #ffffff}')
      );

      const program = {
        node: {
          body: [],
        },
      };

      const opts = { outDir: 'out-dir' };

      extractStyles(types, program, 'filename.js', opts);

      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #000000}')
      );
      // On each transpilation the body does not contain require call added by extractStyles
      program.node.body = [];

      extractStyles(types, program, 'filename.js', opts);

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(fs.writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), 'out-dir/filename.css')
      );
      expect(fs.writeFileSync.mock.calls[0][1]).toMatch(
        '.classname{color: #ffffff}'
      );
      expect(fs.writeFileSync.mock.calls[1][0]).toEqual(
        path.join(process.cwd(), 'out-dir/filename.css')
      );
      expect(fs.writeFileSync.mock.calls[1][1]).toMatch(
        '.classname{color: #000000}'
      );
      expect(program.node.body.length).toBe(1);
    });

    it('should append styles only once if the styles has not changed', () => {
      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #ffffff}')
      );

      const opts = { single: true };

      extractStyles(types, null, 'filename.js', opts);

      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #ffffff}')
      );

      extractStyles(types, null, 'filename.js', opts);

      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), '.linaria-cache/styles.css')
      );
      expect(fs.writeFileSync.mock.calls[0][1]).toMatch(
        '.classname{color: #ffffff}'
      );
    });

    it('should overwrite css if the styles has changed', () => {
      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #ffffff}')
      );

      const opts = { single: true };

      extractStyles(types, null, 'filename.js', opts);

      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #000000}')
      );

      extractStyles(types, null, 'filename.js', opts);

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(fs.writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), '.linaria-cache/styles.css')
      );
      expect(fs.writeFileSync.mock.calls[0][1]).toMatch(
        '.classname{color: #ffffff}'
      );
      expect(fs.writeFileSync.mock.calls[1][0]).toEqual(
        path.join(process.cwd(), '.linaria-cache/styles.css')
      );
      expect(fs.writeFileSync.mock.calls[1][1]).toMatch(
        '.classname{color: #000000}'
      );
      expect(fs.writeFileSync.mock.calls[1][1]).not.toMatch(
        '.classname{color: #ffffff}'
      );
    });

    it('should overwrite css if the new file was added', () => {
      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #ffffff}')
      );

      const opts = { single: true };

      extractStyles(types, null, 'filename1.js', opts);

      getCachedModule.mockImplementationOnce(
        getCachedModuleImpl('.classname{color: #000000}')
      );

      extractStyles(types, null, 'filename2.js', opts);

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(fs.writeFileSync.mock.calls[0][0]).toEqual(
        path.join(process.cwd(), '.linaria-cache/styles.css')
      );
      expect(fs.writeFileSync.mock.calls[0][1]).toMatch(
        '.classname{color: #ffffff}'
      );
      expect(fs.writeFileSync.mock.calls[1][0]).toEqual(
        path.join(process.cwd(), '.linaria-cache/styles.css')
      );
      expect(fs.writeFileSync.mock.calls[1][1]).toMatch(
        '.classname{color: #ffffff}'
      );
      expect(fs.writeFileSync.mock.calls[1][1]).toMatch(
        '.classname{color: #000000}'
      );
    });
  });
});
