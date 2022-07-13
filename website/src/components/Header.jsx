import { styled } from '@linaria/react';
import React from 'react';
import constants from '../styles/constants';
import { media } from '../styles/utils';
import Container from './Container';

import logo from '../../assets/linaria-logo.svg';

export default function Header() {
  return (
    <NavBar>
      <LogoImage src={logo} alt="Linaria Logo" />
      <Links>
        <li>
          <LinkItem href="https://github.com/callstack/linaria#features">
            Features
          </LinkItem>
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
            GitHub
          </LinkItem>
        </li>
      </Links>
    </NavBar>
  );
}

const NavBar = styled(Container)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;

  ${media.medium} {
    flex-direction: row;
  }
`;

const LogoImage = styled.img`
  height: 64px;
  margin: 16px auto;
  display: block;

  ${media.medium} {
    height: 48px;
    margin: 0;
    display: inline-block;
    vertical-align: middle;
  }
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
  font-size: 1.2em;
  font-weight: 700;
  padding: 24px 16px;
  text-decoration: none;
  color: inherit;
  transition: color 0.2s;
  transition: 200ms;

  &:hover {
    color: inherit;
  }

  @supports (-webkit-background-clip: text) {
    background-image: ${constants.gradient};
    /* stylelint-disable-next-line property-no-vendor-prefix */
    -webkit-background-clip: text;

    &:hover {
      color: transparent;
    }
  }
`;
