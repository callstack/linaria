/* @flow */
import * as React from 'react';
import { css } from 'linaria';
import theme from './styles/theme';
// import { media } from './styles/utils';
import Container from './components/Container';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Heading from './components/Heading';
import Terminal from './components/Terminal';
import Footer from './components/Footer';
import './styles/global.css';

export default function Index() {
  return (
    <div>
      <Header />
      <Hero />
      <Features />
      <div>
        <Container>
          <Heading type="h2" className={getStarted}>
            Get Started!{' '}
            <span role="img" aria-labelledby="stars">
              ✨
            </span>
          </Heading>
          <Heading type="h3">Installation and setup</Heading>
          <p>Install it like regular npm package:</p>
          <Terminal lines={['yarn add linaria']} />
          <p>
            Adjust the preset entry in your <code>.babelrc</code> file to look
            like:
          </p>
          <pre className={code}>
            {`{
  "presets": ["linaria/babel"]
}`}
          </pre>
          <p>And you are all set!</p>
          <Heading type="h3">Usage</Heading>
          <p>
            CSS rule declarations use tagged template litreals which produce a
            class name for extraction purposes. Linaria supports SCSS-like
            shorthands and nesting.
          </p>
          <p>In any JavaScript file:</p>
          <pre className={code}>
            {`import React from 'react';
import { css, names } from 'linaria';
import fonts from './fonts';
import colors from './colors';

const container = css\`
  height: 3rem;
\`;

const header = css\`
  font-family: $\{fonts.heading};
  font-size: 3rem;
  color: $\{colors.white};
  margin-bottom: .5rem;

  [data-theme=light] & {
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
}`}
          </pre>
          <p>After Babel transpilation, the code will output following CSS:</p>
          <pre className={code}>
            {`.container__jdh5rtz {
  height: 3rem;
}

.header__xy4ertz {
  font-family: Helvetica, sans-serif; /* constants are automatically inlined */
  font-size: 3rem;
  margin-bottom: .5rem;
}

@media (max-width: 320px) {
  .header__xy4ertz {
    font-size: 2rem;
  }
}

[data-theme=dark] .header__xy4ertz {
  color: #fff;
}`}
          </pre>
          <p>...and the following JavaScript:</p>
          <pre className={code}>
            {`import React from 'react';

export default function Header({ className }) {
  return (
    <div className={'container__jdh5rtz' + ' ' + className)}>
      <h1 className="header__xy4ertz" />
    </div>
  );
}`}
          </pre>
        </Container>
      </div>
      <Footer />
    </div>
  );
}

const code = css`
  padding: 20px;
  background: ${theme.backdrop};
  color: ${theme.primary};
`;

const getStarted = css`
  color: #123;
`;
