/* @flow */

import React from 'react';
import { css, compose } from 'linaria';

const container = css`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: salmon;
  color: white;
  font-family: sans-serif;
`;

const title = css`
  font-size: 3rem;
  font-weight: 300;
  margin: 0;
`;

const text = css`
  font-size: 1.2rem;
  font-weight: 300;
`;

const button = css`
  color: inherit;
  text-decoration: none;
  border-radius: 3px;
  border: 2px solid white;
  background-color: transparent;
  margin: 1rem;
  padding: .5rem 1rem;

  &:hover {
    background-color: white;
    color: salmon;
  }
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
        className={compose(button, text)}
      >
        Learn more
      </a>
    </div>
  );
}
