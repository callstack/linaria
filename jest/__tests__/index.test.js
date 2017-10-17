/* @flow */
import React from 'react';
import renderer from 'react-test-renderer';
import { css } from 'linaria';
import { reactSerializer } from 'linaria/jest';
import CodeBox from '../__fixtures__/CodeBox';

expect.addSnapshotSerializer(reactSerializer);

test('reactSerializer', () => {
  const tree = renderer.create(
    <CodeBox text="test react" className={css`flex: 1;`} />
  );

  expect(tree).toMatchSnapshot();
});
