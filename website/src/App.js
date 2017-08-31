/* @flow */

import React from 'react';
import dedent from 'dedent';
import { css } from 'linaria';
import { media } from './styles/utils';
import Container from './components/Container';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Heading from './components/Heading';
import Terminal from './components/Terminal';
import Footer from './components/Footer';
import CodeBlock from './components/CodeBlock';
import './styles/global.css';

export default function Index() {
  return (
    <div>
      <Header />
      <Hero />
      <Features />
      <div>
        <Container>
          <Heading type="h2" className={getStarted} id="get-started">
            Get Started!{' '}
            <span role="img" aria-labelledby="stars">
              ✨
            </span>
          </Heading>
          <Heading type="h3">Installation and setup</Heading>
          <p>Install it like a regular npm package:</p>
          <Terminal lines={['yarn add linaria']} />
          <p>
            Adjust the preset entry in your <code>.babelrc</code> file to look
            like:
          </p>
          <CodeBlock>
            {dedent(`{
              "presets": [
                "env",
                "react",
                "linaria/babel"
              ]
            }`)}
          </CodeBlock>
          <p>And you are all set!</p>
          <Heading type="h3">Usage</Heading>
          <p>
            CSS rule declarations use tagged template litreals which produce a
            class name for extraction purposes. Linaria supports SCSS-like
            shorthands and nesting.
          </p>
        </Container>
        <div className={result}>
          <div className={resultItem}>
            <CodeBlock language="jsx" className={stretch}>
              {dedent(`// Header.js (source JS)

                import React from 'react';
                import { css, names } from 'linaria';
                import colors from './colors';

                const container = css\`
                  height: 3rem;
                \`;

                const header = css\`
                  color: $\{colors.white};

                  [data-theme=dark] & {
                    color: $\{colors.black}
                  }

                  @media (max-width: 320px) {
                    font-size: 2rem;
                  }
                \`;

                export default function Header({ className }) {
                  return (
                    <div className={names(container, className)}>
                      <h1 className={header} />
                    </div>
                  );
                }`)}
            </CodeBlock>
          </div>
          <div className={resultItem}>
            <CodeBlock language="css" className={stretch}>
              {dedent(`/* Header.css (output CSS) */

                .container__jdh5rtz {
                  height: 3rem;
                }

                .header__xy4ertz {
                  color: #fff;
                }

                @media (max-width: 320px) {
                  .header__xy4ertz {
                    font-size: 2rem;
                  }
                }

                [data-theme=dark] .header__xy4ertz {
                  color: #000;
                }`)}
            </CodeBlock>
          </div>
          <div className={resultItem}>
            <CodeBlock language="jsx" className={stretch}>
              {dedent(`// Header.js (output JS)

                import React from 'react';
                import names from 'linaria/build/names';

                const container = 'container_jdh5rtz';

                const header = 'header_xy4ertz';

                export default function Header({ className }) {
                  return (
                    <div className={names(container, className)}>
                      <h1 className={header} />
                    </div>
                  );
                }`)}
            </CodeBlock>
          </div>
        </div>
      </div>
      <Container>
        <Heading type="h3">Docs and examples</Heading>
        <p>
          We are actively working on broadening our{' '}
          <a href="https://github.com/callstack-io/linaria/docs">
            documentation
          </a>. Also be sure to check the{' '}
          <a href="https://github.com/callstack-io/linaria/tree/master/example">
            example app
          </a>{' '}
          set up with React, Webpack and Linaria
        </p>
      </Container>
      <Footer />
    </div>
  );
}

const getStarted = css`color: #123;`;

const result = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 20px 10px;
`;

const resultItem = css`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  max-width: 100%;
  padding: 0 2px;

  ${media.large} {
    width: 33%;
  }
`;

const stretch = css`flex: 1;`;
