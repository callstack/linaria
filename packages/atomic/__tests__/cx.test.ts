import { cx } from '../src';

it('should filter falsy values and join objects', () => {
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
