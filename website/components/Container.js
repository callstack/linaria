/* @flow */
import * as React from 'react';
import { css } from 'linaria';

type Props = { children: React.Element<*> | Array<React.Element<*>> };

export default function Container({ children }: Props) {
  return (
    <div className={container}>
      {children}
    </div>
  );
}

const container = css`
  max-width: 940px;
  padding: 0 20px;
  margin: 0 auto;
`;
