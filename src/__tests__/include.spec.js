/* @flow */

import sheet from '../sheet';
import css from '../css';
import include from '../include';

describe('include module', () => {
  it('should include styles from a single class name', () => {
    const text = css`font-weight: 400;`;

    const title = css`
      color: orange;

      @media (max-width: 100px) {
        font-family: monospace;
      }
    `;

    const header = css`
      ${include(text, title)};
      font-family: sans-serif;
    `;

    expect(include(title)).toMatchSnapshot();
    expect(include(text, title)).toMatchSnapshot();
    expect(sheet.styles()[`.${header}`]).toMatchSnapshot();
    expect(sheet.dump()).toMatchSnapshot();
  });

  it('should throw for invalid class name', () => {
    expect(() => include('not_valid')).toThrow(
      `Unable to find CSS for the class name: not_valid`
    );
  });
});
