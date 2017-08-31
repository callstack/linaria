/* @flow */

import React from 'react';
import { css } from 'linaria';
import theme from '../styles/theme';

type Props = {
  lines: Array<string>,
};

export default function Terminal(props: Props) {
  return (
    <div className={block}>
      {props.lines.map((line, index) => (
        <span className={codeLine} key={index.toString()}>
          {line}
        </span>
      ))}
    </div>
  );
}

const block = css`
  display: block;
  padding: 20px;
  background: ${theme.backdrop};
  color: ${theme.primary};
  font-family: monospace;
`;

const codeLine = css`
  display: block;

  &::before {
    content: '$ ';
    color: ${theme.text};
  }
`;
