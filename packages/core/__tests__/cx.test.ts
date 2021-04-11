import { cx } from '../src';

it('should filter falsy values', () => {
  expect(cx('1', 'test', false, '2', 0, '', null, undefined, '3')).toBe(
    '1 test 2 3'
  );
});
