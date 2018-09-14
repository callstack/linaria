import linaria, { css, include, names, styles } from '..';

describe('public API', () => {
  test('named export css', () => {
    expect(css).toBeDefined();
  });

  test('named export include', () => {
    expect(include).toBeDefined();
  });

  test('named export names', () => {
    expect(names).toBeDefined();
  });

  test('named export styles', () => {
    expect(styles).toBeDefined();
  });

  test('no default export', () => {
    expect(linaria).toBeUndefined();
  });
});
