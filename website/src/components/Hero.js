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
        <div className={row}>
          <div className={leftColumn}>
            <h1 className={heading}>Zero-Runtime CSS in JS</h1>
            <p className={description}>
              Linaria lets you write CSS in your JS with no runtime overhead
            </p>
            <a href="#get-started" className={button}>
              Get Started
            </a>
          </div>
          <div className={rightColumn}>
            <img
              className={figureImage}
              alt="Linaria code sample"
              src="/images/image-4.png"
            />
          </div>
        </div>
      </Container>
      <div className={wrapper}>
        <div className={logoMarkContainer}>
          <img
            className={logoMark}
            src="/images/linaria-logomark.svg"
            alt="Linaria logo"
          />
        </div>
      </div>
    </div>
  );
}

const hero = css`
  background: #d2356d;
  background: linear-gradient(to bottom right, #96368c, #d2356d);
  padding: 120px 0;
  position: relative;

  ${media.medium} {
    padding: 150px 0;
  }
`;

const row = css`
  ${media.medium} {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

const leftColumn = css`
  text-align: center;
  flex: 3;
  z-index: 1;

  ${media.medium} {
    text-align: left;
  }
`;

const rightColumn = css`
  text-align: center;
  flex: 2;
  z-index: 1;

  ${media.medium} {
    text-align: left;
  }
`;

const heading = css`
  color: ${theme.white};
  font-weight: 700;

  ${media.small} {
    font-size: 2.5em;
  }

  ${media.medium} {
    font-size: 3.5em;
  }
`;

const description = css`
  color: ${theme.white};
  font-weight: 700;
  margin-bottom: 60px;

  ${media.small} {
    font-size: 1em;
  }

  ${media.medium} {
    font-size: 1.2em;
  }
`;

const button = css`
  appearance: none;
  background: none;
  padding: 10px 20px;
  color: ${theme.white};
  font-size: 1em;
  font-weight: 700;
  font-family: ${theme.fontFamily};
  text-transform: uppercase;
  text-decoration: none;
  border: 2px solid ${theme.white};
  border-radius: 30px;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;

  &:hover {
    color: #d2356d;
    background: ${theme.white};
  }

  ${media.medium} {
    padding: 15px 30px;
  }
`;

const figureImage = css`
  width: 100%;
  height: auto;
  margin-top: 30px;

  ${media.medium} {
    margin-top: 0;
  }
`;

const logoMark = css`
  position: absolute;
  left: 0;
  bottom: -50px;
`;

const logoMarkContainer = css`
  position: absolute;

  ${media.medium} {
    left: 62%;
    bottom: 0;
    height: 650px;
    width: 650px;
  }
`;

const wrapper = css`
  position: absolute;
  overflow: hidden;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
`;
