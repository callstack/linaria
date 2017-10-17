import React from 'react'; // eslint-disable-line
import { css, names } from 'linaria';

const theme = {
  backdrop: '#ccc',
  primary: '#123',
  hover: '#fff',
};

export default function CodeBox({ className, text }) {
  return (
    <div className={container}>
      <pre className={names(code, className)}>
        <code className={className}>{text}</code>
      </pre>
    </div>
  );
}

const code = css`
  font-size: 14px;
  padding: 16px;
  background: ${theme.backdrop};
  color: ${theme.primary};
  overflow: auto;
`;

const container = css`
  max-width: 900px;

  &:hover {
    background: ${theme.hover};
  }
`;
