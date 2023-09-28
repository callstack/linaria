import { isSuperSet } from '../Entrypoint.helpers';

describe('isSuperSet', () => {
  it('should be defined', () => {
    expect(isSuperSet).toBeDefined();
  });

  it('should return true if the first set is a superset of the second', () => {
    expect(isSuperSet([1, 2, 3], [1, 2])).toBe(true);
  });

  it('should return false if the first set is not a superset of the second', () => {
    expect(isSuperSet([1, 2], [1, 2, 3])).toBe(false);
  });

  it('should return true if the first set is equal to the second', () => {
    expect(isSuperSet([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it('should return false if the first set is empty', () => {
    expect(isSuperSet([], [1, 2, 3])).toBe(false);
  });

  it('should return true if the second set is empty', () => {
    expect(isSuperSet([1, 2, 3], [])).toBe(true);
  });

  it('should return true if both sets are empty', () => {
    expect(isSuperSet([], [])).toBe(true);
  });

  it('should return true if the first set is a superset of the second with duplicates', () => {
    expect(isSuperSet([1, 2, 3], [1, 2, 2, 2, 1, 3])).toBe(true);
  });

  it('should return true if the first has a wildcard', () => {
    expect(isSuperSet(['*', 1], [1, 2, 3])).toBe(true);
  });

  it('should return false if the second has a wildcard', () => {
    expect(isSuperSet([1, 2, 3], ['*'])).toBe(false);
  });

  it('should return true if both have wildcards', () => {
    expect(isSuperSet(['*', 1, 2], ['*'])).toBe(true);
  });
});
