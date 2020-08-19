import { styled } from 'linaria/react';
import React from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Hero from '../components/Hero';

export default function Index() {
  return (
    <Page>
      <Head>
        <title>Linaria – zero-runtime CSS in JS library</title>
      </Head>
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
