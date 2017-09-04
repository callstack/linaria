/* @flow */

import React from 'react';
import { css, names } from 'linaria';
import theme from '../styles/theme';
import '../utils/prismTemplateString';

type Props = {
  className?: string,
  language?: string,
  children: string,
};

export default function CodeBlock({ className, language, children }: Props) {
  return (
    <pre className={names(code, className)}>
      <code
        className={language && `language-${language}`}
        // eslint-disable-next-line
        dangerouslySetInnerHTML={{__html: prism(children, language)}}
      />
    </pre>
  );
}

const prism = (code, language) =>
  !language || !window.Prism.languages[language]
    ? code
    : window.Prism.highlight(code, window.Prism.languages[language]);

const code = css`
  font-size: 14px;
  padding: 16px;
  background: ${theme.backdrop};
  color: ${theme.primary};
  overflow: auto;
`;
