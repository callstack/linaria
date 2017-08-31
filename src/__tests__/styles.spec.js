/* @flow */

import styles from '../styles';

describe('styles module', () => {
  it('should return an object with class name', () => {
    expect(styles('title', 'heading')).toEqual({ className: 'title heading' });
  });
});
