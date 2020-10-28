import { run } from '@linaria/babel/__tests__/strategy-tester';

describe('extractor', () => {
  run(__dirname, require('../src').default);
});
