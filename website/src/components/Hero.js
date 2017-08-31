/* @flow */

import React from 'react';
import { css } from 'linaria';
import { media } from '../styles/utils';
import theme from '../styles/theme';
import Container from './Container';

export default function Hero() {
  return (
    <div className={hero}>
      <Container>
        <h1 className={heading}>
          Linaria is <br />zero-runtime<br /> CSS in JS library.
        </h1>
        <a href="#get-started" className={button}>
          Get Started
        </a>
      </Container>
    </div>
  );
}

const hero = css`
  background: #fffaf6;
  padding: 70px 0;

  ${media.medium} {
    padding: 120px 0;
  }
`;

const heading = css`
  color: ${theme.primary};
  font-weight: 700;
  font-size: 1.5em;
  line-height: 1.1;
  text-transform: uppercase;
  text-shadow: 0 0 ${theme.secondary}, 1px 1px ${theme.secondary},
    2px 2px ${theme.secondary}, 3px 3px ${theme.secondary},
    4px 4px ${theme.secondary}, 5px 5px ${theme.secondary};

  ${media.small} {
    font-size: 2.5em;
  }

  ${media.medium} {
    font-size: 4em;
  }
`;

const button = css`
  appearance: none;
  background: none;
  padding: 10px 20px;
  color: ${theme.primary};
  font-size: 1em;
  font-weight: 700;
  font-family: ${theme.fontFamily};
  text-transform: uppercase;
  text-decoration: none;
  border: 2px solid ${theme.primary};
  border-radius: 3px;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;

  &:hover {
    color: #fff;
    background: ${theme.primary};
  }

  ${media.medium} {
    padding: 15px 30px;
  }
`;
