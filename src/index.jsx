import { css } from '@linaria/core';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import constants from './styles/constants';

ReactDOM.render(<App />, document.getElementById('root'));

// eslint-disable-next-line import/prefer-default-export
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
