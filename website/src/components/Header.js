/* @flow */

import React from 'react';
import { css } from 'linaria';
import Container from './Container';
import theme from '../styles/theme';

const navVerticalSpacing = 20;
const navHorizontalSpacing = 10;

export default function Header() {
  return (
    <div className={header}>
      <Container className={headerContainer}>
        <a className={logoLink} href="/">
          <img
            className={logo}
            src="/images/linaria-logo.svg"
            alt="Linaria Logo"
          />
        </a>
        <ul className={nav}>
          <li>
            <a className={navLink} href="#features">
              Features
            </a>
          </li>
          <li>
            <a
              className={navLink}
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/callstack/linaria/tree/master/docs"
            >
              Docs
            </a>
          </li>
          <li>
            <a
              className={navLink}
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/callstack/linaria"
              title="GitHub"
            >
              <img className={image} src="./images/github.svg" alt="GitHub" />
            </a>
          </li>
        </ul>
      </Container>
    </div>
  );
}

const header = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
`;

const headerContainer = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const logo = css`
  height: 25px;
  display: inline-block;
  vertical-align: middle;
`;

const logoLink = css`
  display: inline-block;
`;

const nav = css`
  display: flex;
  padding: 0;
  margin: 0;
  list-style: none;
  align-items: center;
`;

const navLink = css`
  display: block;
  padding: ${navVerticalSpacing}px ${navHorizontalSpacing}px;
  text-decoration: none;
  color: ${theme.white};
  transition: color 0.2s;
  font-size: 1.3em;
  font-weight: 700;

  &:hover {
    color: ${theme.hoveredWhite};
  }
`;

const image = css`
  width: 1.5em;
  height: 1.5em;
  border-radius: 50%;
  transition: 0.2s background;
`;
