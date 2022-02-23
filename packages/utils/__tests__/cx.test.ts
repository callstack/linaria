import cx from '../src/cx';

it('should filter falsy values', () => {
  expect(cx('1', 'test', false, '2', 0, '', null, undefined, '3')).toBe(
    '1 test 2 3'
  );
});

it('should join atoms together, de-duplicating by property and joining the values', () => {
  expect(cx('atm_a_class1 atm_b_class2', 'atm_a_class3')).toBe(
    'atm_a_class3 atm_b_class2'
  );
});

it('should join atoms and non atoms together at the same time', () => {
  expect(
    cx('atm_a_1', 'atm_b_2', false, '2', 0, '', null, undefined, '3', 'atm_b_3')
  ).toBe('atm_a_1 atm_b_3 2 3');
});
