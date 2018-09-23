/* @flow */

import React from 'react';
import { styled } from 'linaria/react';
import { media } from '../styles/utils';
import theme from '../styles/theme';
import Container from './Container';

export default function Hero() {
  return (
    <HeroContainer>
      <Container>
        <Row>
          <LeftColumn>
            <Heading>Zero-Runtime CSS in JS</Heading>
            <Description>
              Linaria lets you write CSS in your JS with no runtime overhead
            </Description>
            <Button as="a" href="#get-started">
              Get Started
            </Button>
          </LeftColumn>
          <RightColumn>
            <CodeSample alt="Linaria code sample" src="/images/image-4.png" />
          </RightColumn>
        </Row>
      </Container>
      <Wrapper>
        <LogoMarkContainer>
          <LogoMark src="/images/linaria-logomark.svg" alt="Linaria logo" />
        </LogoMarkContainer>
      </Wrapper>
    </HeroContainer>
  );
}

const HeroContainer = styled.main`
  background: #d2356d;
  background: linear-gradient(to bottom right, #96368c, #d2356d);
  padding: 120px 0;
  position: relative;

  ${media.medium} {
    padding: 150px 0;
  }
`;

const Row = styled.div`
  ${media.medium} {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

const LeftColumn = styled.div`
  text-align: center;
  flex: 3;
  z-index: 1;

  ${media.medium} {
    text-align: left;
  }
`;

const RightColumn = styled.div`
  text-align: center;
  flex: 2;
  z-index: 1;

  ${media.medium} {
    text-align: left;
  }
`;

const Heading = styled.h1`
  color: ${theme.white};
  font-weight: 700;

  ${media.small} {
    font-size: 2.5em;
  }

  ${media.medium} {
    font-size: 3.5em;
  }
`;

const Description = styled.p`
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

const Button = styled.button`
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

const CodeSample = styled.img`
  width: 100%;
  height: auto;
  margin-top: 30px;

  ${media.medium} {
    margin-top: 0;
  }
`;

const LogoMark = styled.img`
  position: absolute;
  left: 0;
  bottom: -50px;
`;

const LogoMarkContainer = styled.div`
  position: absolute;

  ${media.medium} {
    left: 62%;
    bottom: 0;
    height: 650px;
    width: 650px;
  }
`;

const Wrapper = styled.div`
  position: absolute;
  overflow: hidden;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
`;
