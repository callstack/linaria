/* @flow */

import * as React from 'react';
import { styled } from 'linaria/react';

type Props = {
  as?: React$ElementType,
  primary: boolean,
  children?: React.Node,
};

const PRIMARY_COLOR = '#f15f79';

const Button: React.ComponentType<Props> = styled.button`
  display: inline-block;
  appearance: none;
  margin: 12px 8px;
  min-width: 120px;
  white-space: nowrap;
  font-size: inherit;
  font-weight: 600;
  text-align: center;
  padding: 8px 12px;
  border-radius: 4px;
  border: 2px solid ${PRIMARY_COLOR};
  background-color: ${(props: Props) =>
    props.primary ? PRIMARY_COLOR : 'transparent'};
  color: ${(props: Props) => (props.primary ? '#fff' : PRIMARY_COLOR)};
  cursor: pointer;

  &:hover,
  &:focus,
  &:active {
    background-color: ${PRIMARY_COLOR};
    color: #fff;
  }

  &:first-of-type {
    margin-left: 0;
  }

  &:last-of-type {
    margin-right: 0;
  }
`;

export default Button;
