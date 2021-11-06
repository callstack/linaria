/* @flow */

import { css } from '@linaria/atomic';
import { styled } from '@linaria/react';

const Container = styled.div`
  max-width: 1140px;
  padding: 16px 24px;
  margin: 0 auto;
`;

const x = css`
  background: red;
  height: 100px;
`;

console.log(x);

export default Container;
