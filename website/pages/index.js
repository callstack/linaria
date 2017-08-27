/* @flow */
import React from 'react';
import { css } from 'linaria';
import theme from '../styles/theme';
import '../styles/global.css';

export default function Index() {
  return (
    <div>
      <div className={hero}>
        <h1>CSS the way you like it</h1>
        <h3>
          Linaria extracts the CSS from your JavaScript files and it is dope
        </h3>
        <button className={button}>Get Started</button>
      </div>
    </div>
  );
}

const hero = css`
  background: ${theme.secondary};
`;

const button = css`
  appearance: none;
  background: none;
  padding: 15px 30px;
  font-size: 1em;
  font-weight: 600;
  text-transform: uppercase;
  border: 2px solid ${theme.primary};
  border-radius: 3px;
`;
