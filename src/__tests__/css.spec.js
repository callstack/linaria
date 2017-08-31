/* @flow */

import css from '../css';

describe('css module', () => {
  it('should return a class name given some css', () => {
    const color = 'blue';
    const title = css`color: ${color};`;

    expect(title).toBe('css__1r77qux');
  });

  it('should return a class name with variable name', () => {
    const title = css.named('header')`
      color: blue;
    `;

    expect(title).toBe('header__1r77qux');
  });
});
