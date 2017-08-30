/* @flow */

import React from 'react';
import { css, names } from 'linaria';

type Props = {
  children: React$Element<*> | Array<React$Element<*>>,
  className?: string,
};

export default function Container({ className, children }: Props) {
  return <div className={names(container, className)}>{children}</div>;
}

const container = css`
  max-width: 940px;
  padding: 0 20px;
  margin: 0 auto;
`;
