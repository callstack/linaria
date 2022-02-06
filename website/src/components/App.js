/* @flow */

import React from 'react';
import { css, cx } from '@linaria/atomic';
import Header from './Header';
import Hero from './Hero';

const Page = css`
  background: red;
  height: 100px;
`;

export default function Index() {
  return (
    <div className={cx(Page)}>
      <Header />
      <Hero />
    </div>
  );
}
