/* @flow */
import 'prism'; // eslint-disable-line
import React from 'react';
import ReactDOM from 'react-dom';
import { css } from 'linaria';
import theme from './styles/theme';
import App from './App';

const html = css`
  height: 100%;
  width: 100%;
  color: ${theme.text};
  font-family: ${theme.fontFamily};
  font-weight: 300;
  font-size: 16px;
  line-height: 1.4;

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
