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
              <img
                className={figureImage}
                alt=""
                src="//placehold.it/150x150"
              />
            </div>
            <Heading type="h4" className={title}>
              Familiar syntax
            </Heading>
            <p>
              Linaria uses CSS syntax and API similar to{' '}
              <code>styled-compontents</code>
            </p>
          </div>
          <div className={item}>
            <div className={figure}>
              <img
                className={figureImage}
                alt=""
                src="//placehold.it/150x150"
              />
            </div>
            <Heading type="h4" className={title}>
              Zero runtime
            </Heading>
            <p>
              CSS is extracted from JS code, so with Dead Code Elimination and
              Tree Shaking you can strip Linaria code completely.
            </p>
          </div>
          <div className={item}>
            <div className={figure}>
              <img
                className={figureImage}
                alt=""
                src="//placehold.it/150x150"
              />
            </div>
            <Heading type="h4" className={title}>
              SSR with critical CSS
            </Heading>
            <p>
              Generating ciritcal CSS for server rendered apps has never been
              easier.
            </p>
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
  dispaly: flex;
  flexDirection: column;

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
  margin: 0 auto;
  width: 100px;
  height: 100px;
  overflow: hidden;
  border: 1px solid ${theme.secondary};
`;

const figureImage = css`
  width: 100%;
  object-fit: cover;
`;
