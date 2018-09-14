/* @flow */

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import '../static/vendor/prism';
import globalStyles from './styles/global';

const style = document.createElement('style');

style.appendChild(document.createTextNode(globalStyles));

if (document.documentElement) {
  document.documentElement.appendChild(style);
}

ReactDOM.render(<App />, document.getElementById('root'));
