/* @flow */

import { css } from 'linaria';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import constants from './styles/constants';

/* $FlowFixMe */
ReactDOM.render(<App />, document.getElementById('root'));

export const globals = css`
  :global() {
    html {
      box-sizing: border-box;
      height: 100%;
      width: 100%;
    }

    body {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      font-family: ${constants.fontFamily};
      font-size: 20px;
      line-height: 1.42857;
    }

    *,
    *:before,
    *:after {
      box-sizing: inherit;
    }
  }
`;
