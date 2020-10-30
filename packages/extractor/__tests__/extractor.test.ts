import { run } from '@linaria/babel/__utils__/strategy-tester';

describe('extractor', () => {
  run(__dirname, require('../src').default);
});
