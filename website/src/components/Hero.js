/* @flow */
import * as React from 'react';
import { css } from 'linaria';
import { media } from '../styles/utils';
import theme from '../styles/theme';
import Container from './Container';

export default function Hero() {
  return (
    <div className={hero}>
      <Container>
        <h1 className={heading}>Linaria is zero-runtime CSS in JS library.</h1>
        <button className={button}>Get Started</button>
      </Container>
    </div>
  );
}

const hero = css`
  background: #fffaf6;
  padding: 70px 0;

  ${media.medium} {
    padding: 150px 0;
  }
`;

const heading = css`
  color: ${theme.primary};
  font-weight: 700;
  font-size: 1.5em;
  line-height: 1.1;
  text-transform: uppercase;
  text-shadow: 0 0 ${theme.secondary}, 1px 1px ${theme.secondary}, 2px 2px ${theme.secondary}, 3px 3px ${theme.secondary}, 4px 4px ${theme.secondary}, 5px 5px ${theme.secondary};

  ${media.small} {
    font-size: 2.5em;
  }

  ${media.medium} {
    font-size: 3.5em;
  }
`;

const button = css`
  appearance: none;
  background: none;
  padding: 15px 30px;
  color: ${theme.primary};
  font-size: 1em;
  font-weight: 700;
  font-family: ${theme.fontFamily};
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 2px solid ${theme.primary};
  border-radius: 3px;
  cursor: pointer;
  transition: color .2s, background .2s;

  &:hover {
    color: #fff;
    background: ${theme.primary}
  }
`;
