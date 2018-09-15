/* @flow */

import React from 'react';
import { css, cx } from 'linaria';
import theme from '../styles/theme';

type Props = {
  className?: string,
  language?: string,
  text: string,
};

export default function CodeBlock({ className, language, text }: Props) {
  return (
    <pre className={cx(code, className)}>
      <code
        className={language && `language-${language}`}
        // eslint-disable-next-line
        dangerouslySetInnerHTML={{__html: prism(text, language)}}
      />
    </pre>
  );
}

const { Prism } = global;

const prism = (code, language) =>
  !Prism || !language || (Prism && !Prism.languages[language])
    ? code
    : Prism.highlight(code, Prism.languages[language]);

const code = css`
  font-size: 14px;
  padding: 16px;
  background: ${theme.backdrop};
  color: ${theme.primary};
  overflow: auto;
`;
