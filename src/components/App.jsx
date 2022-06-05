import React from 'react';
import { css, cx } from '@linaria/atomic';
import Header from './Header';
import Hero from './Hero';

const Page = css`
  background: linear-gradient(to bottom right, #b24592, #f15f79);
  color: #fff;
  min-height: 100vh;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.08);
`;

export default function Index() {
  return (
    <div className={cx(Page)}>
      <Header />
      <Hero />
    </div>
  );
}
