/* @flow */

import css from '../css';

describe('css module', () => {
  it('should return a class name given some css', () => {
    const color = 'blue';
    const title = css`
      color: ${color};
    `;

    expect(title).toBe('css_969c2487');
  });

  it('should return a class name with variable name', () => {
    const title = css.named('header')`
      color: blue;
    `;

    expect(title).toBe('header_969c2487');
  });
});
