/* @flow */

import React from 'react';
import { css, compose } from 'linaria';
import colors from './colors';

const container = css`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-image: linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%);
  color: white;
  font-family: sans-serif;
`;

const title = css`
  font-size: 3rem;
  font-weight: 300;
  margin: 0;
`;

const button = css`
  font-size: 1rem;
  color: inherit;
  text-decoration: none;
  border-radius: 3px;
  border: 2px solid white;
  background-color: transparent;
  margin: 1rem;
  padding: .5rem 1rem;
  transition: 200ms ease-in;

  &:hover {
    background-color: white;
    color: ${colors.primary};
  }
`;

const text = css`
  font-size: 1.2rem;
  font-weight: 300;
`;

export default function App() {
  return (
    <div className={container}>
      <h1 className={title}>Linaria</h1>
      <p className={text}>
        Fast zero-runtime CSS in JS library
      </p>
      <a
        href="https://github.com/callstack-io/linaria"
        className={compose(text, button)}
      >
        Learn more
      </a>
    </div>
  );
}
