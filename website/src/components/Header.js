/* @flow */
import * as React from 'react';
import { css } from 'linaria';
import Container from './Container';
import theme from '../styles/theme';

const navSpacing = 20;

export default function Header() {
  return (
    <div className={header}>
      <Container className={headerContainer}>
        <a className={logo} href="/">
          Linaria
        </a>
        <ul className={nav}>
          <li>
            <a className={navLink} href="/docs">
              Docs
            </a>
          </li>
          <li>
            <a
              className={navLink}
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/callstack-io/linaria"
            >
              GitHub
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
`;

const headerContainer = css`
  display: flex;
  justify-content: space-between;
`;

const logo = css`
  display: block;
  text-decoration: none;
  font-weight: 700;
  text-transform: uppercase;
  padding: ${navSpacing}px 0;
  color: ${theme.primary};
`;

const nav = css`
  display: flex;
  padding: 0;
  margin: 0;
  list-style: none;
`;

const navLink = css`
  display: block;
  padding: ${navSpacing}px;
  text-decoration: none;
  color: ${theme.text};
  transition: color .2s;

  &:hover {
    color: ${theme.primary}
  }
`;
