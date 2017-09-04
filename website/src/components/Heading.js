/* @flow */

import React from 'react';
import { css, include, names } from 'linaria';
import { media } from '../styles/utils';

type AvailableHeadings = 'h1' | 'h2' | 'h3' | 'h4';

type Props = {
  type: AvailableHeadings,
  className?: string,
};

export default function Heading(props: Props) {
  let headingStyle;
  switch (props.type) {
    case 'h1':
      headingStyle = heading1;
      break;
    case 'h2':
      headingStyle = heading2;
      break;
    case 'h3':
      headingStyle = heading3;
      break;
    default:
      headingStyle = heading4;
      break;
  }

  const passedProps = Object.assign({}, props, {
    className: names(headingStyle, props.className),
  });

  return React.createElement(props.type, passedProps);
}

const shared = css`
  margin: 1em 0;
  font-weight: 600;
  line-height: 1.1;
`;

const heading1 = css`
  ${include(shared)};

  font-size: 2em;

  ${media.medium} {
    font-size: 3em;
  }

  ${media.large} {
    font-size: 4em;
  }
`;

const heading2 = css`
  ${include(shared)};

  font-size: 1.5em;

  ${media.medium} {
    font-size: 2em;
  }

  ${media.large} {
    font-size: 2.5em;
  }
`;

const heading3 = css`
  ${include(shared)};

  font-size: 1.25em;

  ${media.medium} {
    font-size: 1.5em;
  }

  ${media.large} {
    font-size: 2em;
  }
`;

const heading4 = css`
  ${include(shared)};

  font-size: 1em;

  ${media.medium} {
    font-size: 1.1em;
  }

  ${media.large} {
    font-size: 1.2em;
  }
`;
