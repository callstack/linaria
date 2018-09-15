/* @flow */

import React from 'react';
import { css, cx } from 'linaria';

type Props = {
  children: React$Element<*> | Array<React$Element<*>>,
  className?: string,
};

export default function Container({ className, children }: Props) {
  return <div className={cx(container, className)}>{children}</div>;
}

const container = css`
  max-width: 1140px;
  padding: 0 20px;
  margin: 0 auto;
`;
