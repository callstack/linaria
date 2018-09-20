/* @flow */

import React from 'react';
import { styled } from 'linaria/react';
import Container from './Container';
import theme from '../styles/theme';

const navVerticalSpacing = 20;
const navHorizontalSpacing = 10;

export default function Header() {
  return (
    <NavBar>
      <NavBarContainer>
        <LogoLink href="/">
          <LogoImage src="/images/linaria-logo.svg" alt="Linaria Logo" />
        </LogoLink>
        <Links>
          <li>
            <LinkItem href="#features">Features</LinkItem>
          </li>
          <li>
            <LinkItem
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/callstack/linaria/tree/master/docs"
            >
              Docs
            </LinkItem>
          </li>
          <li>
            <LinkItem
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/callstack/linaria"
              title="GitHub"
            >
              <GitHubLogo src="./images/github.svg" alt="GitHub" />
            </LinkItem>
          </li>
        </Links>
      </NavBarContainer>
    </NavBar>
  );
}

const NavBar = styled.nav`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
`;

const NavBarContainer = styled(Container)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LogoLink = styled.a`
  display: inline-block;
`;

const LogoImage = styled.img`
  height: 32px;
  display: inline-block;
  vertical-align: middle;
`;

const Links = styled.ul`
  display: flex;
  padding: 0;
  margin: 0;
  list-style: none;
  align-items: center;
`;

const LinkItem = styled.a`
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

const GitHubLogo = styled.img`
  width: 1.5em;
  height: 1.5em;
  border-radius: 50%;
  transition: 0.2s background;
`;
