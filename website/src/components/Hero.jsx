import { styled } from '@linaria/react';
import React from 'react';
import { media } from '../styles/utils';
import Container from './Container';

import codeSample from '../../assets/code-sample-v4.png';
import linariaLogomark from '../../assets/linaria-logomark.svg';

export default function Hero() {
  return (
    <HeroContainer>
      <Container>
        <Row>
          <LeftColumn>
            <Heading>Zero-Runtime CSS in JS</Heading>
            <Description>
              Write CSS in JS and get real CSS files during build. Use dynamic
              prop based styles with the React bindings and have them transpiled
              to CSS variables automatically. Great productivity with source
              maps and linting support.
            </Description>
            <Button
              as="a"
              href="https://github.com/callstack/linaria#installation"
            >
              Get Started
            </Button>
          </LeftColumn>
          <RightColumn>
            <CodeSample alt="Linaria code sample" src={codeSample} />
          </RightColumn>
        </Row>
      </Container>
    </HeroContainer>
  );
}

const HeroContainer = styled.main`
  position: relative;

  ${media.large} {
    padding: 64px 0;
    background-image: url(${linariaLogomark});
    background-repeat: no-repeat;
    background-position: bottom right;
  }
`;

const Row = styled.div`
  ${media.large} {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

const LeftColumn = styled.div`
  text-align: center;
  flex: 3;

  ${media.large} {
    text-align: left;
  }
`;

const RightColumn = styled.div`
  text-align: center;
  flex: 2;
  z-index: 1;
`;

const Heading = styled.h1`
  font-weight: 700;
  font-size: 56px;
`;

const Description = styled.p`
  margin-bottom: 60px;
`;

const Button = styled.button`
  display: inline-block;
  appearance: none;
  background: none;
  border: 0;
  padding: 16px 24px;
  color: inherit;
  font-size: inherit;
  font-weight: 700;
  font-family: inherit;
  text-transform: uppercase;
  text-decoration: none;
  box-shadow: inset 0 0 0 2px currentColor, 1px 1px 1px rgba(0, 0, 0, 0.08);
  border-radius: 30px;
  cursor: pointer;
  transition: color 200ms, background 200ms;

  &:hover {
    color: #d2356d;
    box-shadow: inset 0 0 0 2px transparent, 1px 1px 1px rgba(0, 0, 0, 0.08);
    background: linear-gradient(
      to right,
      hsl(180, 100%, 70%),
      hsl(64, 57%, 82%),
      hsl(0, 100%, 84%)
    );
  }
`;

const CodeSample = styled.img`
  width: 100%;
  height: auto;
  margin: 64px 24px;
  padding: 20px;
  border-radius: 5px;
  max-width: calc(100% - 48px);
  box-shadow: 3px 3px 32px rgba(0, 0, 0, 0.32);
  background-color: #272727;

  ${media.large} {
    margin: 24px;
  }
`;
