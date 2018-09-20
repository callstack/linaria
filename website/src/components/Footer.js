/* @flow */

import React from 'react';
import { styled } from 'linaria/react';
import Container from './Container';

export default function Footer() {
  return (
    <FooterContainer>
      <Inner>
        <p>&copy; 2017 Callstack.io</p>
      </Inner>
    </FooterContainer>
  );
}

const FooterContainer = styled.div`
  margin-top: 100px;
  padding: 30px 0;
  font-size: 0.9em;
`;

const Inner = styled(Container)`
  display: flex;
`;
