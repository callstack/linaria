import { run } from '@linaria/babel-preset/__utils__/strategy-tester';

describe('extractor', () => {
  run(__dirname, require('../src').default);
});
