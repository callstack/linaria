/* @flow */

import React from 'react';
import { styled } from 'linaria/react';
import theme from '../styles/theme';

type Props = {
  lines: Array<string>,
};

export default function Terminal(props: Props) {
  return (
    <Block>
      {props.lines.map((line, index) => (
        <CodeLine key={index.toString()}>{line}</CodeLine>
      ))}
    </Block>
  );
}

const Block = styled.div`
  display: block;
  padding: 20px;
  background: ${theme.backdrop};
  color: ${theme.primary};
  font-family: 'Fira Mono', monospace;
`;

const CodeLine = styled.span`
  display: block;

  &::before {
    content: '$ ';
    color: ${theme.text};
  }
`;
