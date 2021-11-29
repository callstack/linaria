import cx from '../src/cx';

it('should filter falsy values', () => {
  expect(cx('1', 'test', false, '2', 0, '', null, undefined, '3')).toBe(
    '1 test 2 3'
  );
});

it('should join objects together, de-duplicating by property and joining the values', () => {
  expect(
    cx({ color: 'class1', textDecoration: 'class2' }, { color: 'class3' })
  ).toBe('class3 class2');
});

it('should join objects and strings together at the same time', () => {
  expect(
    cx(
      { color: 'atm_a', padding: 'atm_b' },
      { color: 'atm_c' },
      false,
      '2',
      0,
      '',
      null,
      undefined,
      '3'
    )
  ).toBe('atm_c atm_b 2 3');
});
