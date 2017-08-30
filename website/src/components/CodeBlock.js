/* @flow */
import React, { Component } from 'react';
import { css, names } from 'linaria';
import theme from '../styles/theme';
import '../utils/prismTemplateString';

type Props = {
  className?: string,
  language?: string,
  children: string,
};

type State = {
  __html: *,
};

export default class CodeBlock extends Component<Props, State> {
  state = {
    __html: prism(this.props.children, this.props.language),
  };

  componentWillReceiveProps({ children, language }: Props) {
    if (children !== this.props.children || language !== this.props.language) {
      this.setState({ __html: prism(children, language) });
    }
  }

  render() {
    const { className, language } = this.props;
    const { __html } = this.state;
    return (
      <pre className={names(code, className)}>
        <code
          className={language && `language-${language}`}
          // eslint-disable-next-line
          dangerouslySetInnerHTML={{ __html }}
        />
      </pre>
    );
  }
}

const prism = (code, language) => {
  if (!language || !window.Prism.languages[language]) {
    return code;
  }

  return window.Prism.highlight(code, window.Prism.languages[language]);
};

const code = css`
  padding: 20px;
  background: ${theme.backdrop};
  color: ${theme.primary};
  overflow: auto;
`;
