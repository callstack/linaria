/* @flow */

import React from 'react';
import { css } from 'linaria';
import Container from './Container';

export default function Footer() {
  return (
    <div className={footer}>
      <Container className={footerContainer}>
        <p>&copy; 2017 Callstack.io</p>
      </Container>
    </div>
  );
}

const footer = css`
  margin-top: 100px;
  padding: 30px 0;
  font-size: 0.9em;
`;

const footerContainer = css`display: flex;`;
