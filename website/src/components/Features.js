/* @flow */

import React from 'react';
import { css } from 'linaria';
import { media } from '../styles/utils';
import theme from '../styles/theme';
import Container from './Container';
import Heading from './Heading';

export default function Hero() {
  return (
    <div className={features}>
      <Container>
        <div className={container}>
          <div className={item}>
            <div className={figure}>
              <img className={figureImage} alt="" src="/images/image-1.png" />
            </div>
            <Heading type="h4" className={title}>
              Familiar syntax
            </Heading>
            <p>Linaria uses classic CSS syntax with nesting support.</p>
          </div>
          <div className={item}>
            <div className={figure}>
              <img className={figureImage} alt="" src="/images/image-3.png" />
            </div>
            <Heading type="h4" className={title}>
              Zero runtime
            </Heading>
            <p>All CSS is extracted when transpiling the code with Babel.</p>
          </div>
          <div className={item}>
            <div className={figure}>
              <img className={figureImage} alt="" src="/images/image-2.png" />
            </div>
            <Heading type="h4" className={title}>
              SSR with critical CSS
            </Heading>
            <p>Critical CSS can be determined for SSR to improve load time.</p>
          </div>
        </div>
      </Container>
    </div>
  );
}

const features = css`
  margin: 70px 0;

  ${media.medium} {
    margin: 120px 0;
  }
`;

const container = css`
  ${media.medium} {
    display: flex;
    justify-content: space-around;
    margin-left: -30px;
    margin-right: -30px;
  }
`;

const item = css`
  ${media.medium} {
    text-align: center;
    padding: 0 30px;
    flex: 1;
  }
`;

const title = css`
  text-transform: uppercase;
  margin: 1em 0;
  color: ${theme.primary};
`;

const figure = css`
  display: flex;
  align-items: flex-end;
  margin: 0 auto;
  width: 100%;
  max-width: 260px;
  height: 200px;
`;

const figureImage = css`
  width: 100%;
  object-fit: cover;
`;
