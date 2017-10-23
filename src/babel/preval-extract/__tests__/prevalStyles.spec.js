import * as babel from 'babel-core';
import prevalStyles from '../prevalStyles';
import getReplacement from '../getReplacement';
import {
  instantiateModule,
  clearLocalModulesFromCache,
} from '../../lib/moduleSystem';

jest.mock('../getReplacement');
jest.mock('../../lib/moduleSystem', () => ({
  clearLocalModulesFromCache: jest.fn(),
  instantiateModule: jest.fn(() => ({ exports: 'header__abc123' })),
}));

function runAssertions(expectedReplacement) {
  const path = {
    node: {
      loc: {
        start: { line: 5, column: 0 },
      },
    },
    parent: {
      id: {
        name: 'header',
      },
    },
    parentPath: {
      node: {
        init: null,
      },
    },
    getSource() {
      return 'css`color: #ffffff`';
    },
    findParent() {
      return this.parentPath;
    },
    scope: {
      generateUidIdentifier: name => ({
        name,
      }),
    },
  };

  prevalStyles(babel, 'header', path, { filename: 'test.js' }, []);

  expect(getReplacement).toHaveBeenCalled();
  expect(getReplacement.mock.calls[0][0][0].code).toMatch(expectedReplacement);
  expect(clearLocalModulesFromCache).toHaveBeenCalled();
  expect(instantiateModule).toHaveBeenCalled();
}

describe('preval-extract/prevalStyles', () => {
  beforeEach(() => {
    process.env.NODE_ENV = '';
    getReplacement.mockClear();
    instantiateModule.mockClear();
    clearLocalModulesFromCache.mockClear();
  });

  it('should eval styles and replace css with class name from content', () => {
    runAssertions("css.named('header', 'test.js')`color: #ffffff`");
  });

  it('should eval styles and replace css with class name from filename', () => {
    process.env.NODE_ENV = 'production';
    runAssertions("css.named('header')`color: #ffffff`");
    process.env.NODE_ENV = '';
  });
});
