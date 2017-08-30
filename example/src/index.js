/* @flow */

import React from 'react';
import ReactDOM from 'react-dom';
import { css } from 'linaria';
import App from './App';

const html = css`
  height: 100%;
  width: 100%;

  body,
  #root {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
  }
`;

if (document.documentElement) {
  document.documentElement.classList.add(html);
}

ReactDOM.render(<App />, document.getElementById('root'));
