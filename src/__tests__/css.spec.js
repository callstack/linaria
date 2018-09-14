/* @flow */

import css from '../css';

jest.mock('../babel/lib/errorUtils', () => ({
  getFramesFromStack: (...args) =>
    require
      // $FlowFixMe
      .requireActual('../babel/lib/errorUtils')
      .getFramesFromStack(...args),
  enhanceFrames: frames => frames,
}));

describe('css module', () => {
  it('should return a class name given some css', () => {
    const color = 'blue';
    const title = css`
      color: ${color};
    `;

    expect(title).toBe('css__1r77qux');
  });

  it('should return a class name with variable name', () => {
    const title = css.named('header')`
      color: blue;
    `;

    expect(title).toBe('header__1r77qux');
  });

  it('should throw error if there is undefined or null expression', () => {
    expect(() => {
      css.named('test')`
        color: ${undefined}
      `;
    }).toThrowError('Expression cannot be undefined or null');

    expect(() => {
      css.named('test')`color: ${null}`;
    }).toThrowError('Expression cannot be undefined or null');
  });
});
