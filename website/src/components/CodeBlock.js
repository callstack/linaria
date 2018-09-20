/* @flow */

import React from 'react';
import { styled } from 'linaria/react';
import theme from '../styles/theme';

type Props = {
  className?: string,
  language?: string,
  text: string,
};

export default function CodeBlock({ className, language, text }: Props) {
  return (
    <CodeWrapper className={className}>
      <code
        className={language && `language-${language}`}
        // eslint-disable-next-line
        dangerouslySetInnerHTML={{__html: prism(text, language)}}
      />
    </CodeWrapper>
  );
}

const { Prism } = global;

const prism = (code, language) =>
  !Prism || !language || (Prism && !Prism.languages[language])
    ? code
    : Prism.highlight(code, Prism.languages[language]);

const CodeWrapper = styled.pre`
  font-size: 14px;
  padding: 16px;
  background: ${theme.backdrop};
  color: ${theme.primary};
  overflow: auto;
`;
