/* @flow */

import { styled } from 'linaria/react';
import React from 'react';
import Header from './Header';
import Hero from './Hero';

export default function Index() {
  return (
    <Page>
      <Header />
      <Hero />
    </Page>
  );
}

const Page = styled.div`
  background: linear-gradient(to bottom right, #b24592, #f15f79);
  color: #fff;
  min-height: 100vh;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.08);
`;
