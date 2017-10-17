/* @flow */
/** @jsx h */

import { h } from 'preact';
import render from 'preact-render-to-string';
import { css } from 'linaria';
import { preactSerializer } from 'linaria/jest';
import CodeBox from '../__fixtures__/CodeBox.preact';

expect.addSnapshotSerializer(preactSerializer);

test('preactSerializer', () => {
  const style = css`flex: 1;`;
  const tree = render(<CodeBox text="test preact" className={style} />, null, {
    pretty: true,
  });

  expect(tree).toMatchSnapshot();
});
