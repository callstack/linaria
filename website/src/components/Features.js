/* @flow */

import React from 'react';
import { styled } from 'linaria/react';
import { media } from '../styles/utils';
import theme from '../styles/theme';
import Container from './Container';
import Heading from './Heading';

export default function Hero() {
  return (
    <Features>
      <Container>
        <Content id="features">
          <Item>
            <Figure>
              <FigureImage alt="" src="/images/image-1.png" />
            </Figure>
            <Title type="h4">Familiar syntax</Title>
            <p>Linaria uses classic CSS syntax with nesting support.</p>
          </Item>
          <Item>
            <Figure>
              <FigureImage alt="" src="/images/image-3.png" />
            </Figure>
            <Title type="h4">Zero runtime</Title>
            <p>All CSS is extracted when transpiling the code with Babel.</p>
          </Item>
          <Item>
            <Figure>
              <FigureImage alt="" src="/images/image-2.png" />
            </Figure>
            <Title type="h4">SSR with critical CSS</Title>
            <p>Critical CSS can be determined for SSR to improve load time.</p>
          </Item>
        </Content>
      </Container>
    </Features>
  );
}

const Features = styled.div`
  margin: 70px 0;

  ${media.medium} {
    margin: 120px 0;
  }
`;

const Content = styled.div`
  ${media.medium} {
    display: flex;
    justify-content: space-around;
    margin-left: -30px;
    margin-right: -30px;
  }
`;

const Item = styled.div`
  text-align: center;

  ${media.medium} {
    padding: 0 30px;
    flex: 1;
  }
`;

const Title = styled(Heading)`
  text-transform: uppercase;
  margin: 1em 0;
  color: ${theme.primary};
`;

const Figure = styled.figure`
  display: flex;
  align-items: flex-end;
  margin: 0 auto;
  width: 100%;
  max-width: 260px;
  height: 200px;
`;

const FigureImage = styled.img`
  width: 100%;
  object-fit: cover;
`;
