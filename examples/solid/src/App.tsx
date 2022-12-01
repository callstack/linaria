import type { Component } from 'solid-js';

import logo from './logo.svg';
import { styled } from '@linaria/solid';
import {css} from '@linaria/core'

const globals = css`
  :global() {
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    code {
      font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
    }
  }
`;

const AppStyled = styled.div`
  text-align: center;
`

const HeaderStyled = styled.header`
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
`

const LogoStyled = styled.img`
  animation: logo-spin infinite 20s linear;
  height: 40vmin;
  pointer-events: none;

  @keyframes logo-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`

const LinkStyled = styled.a`
  color: #b318f0;
`

const App: Component = () => {
  return (
    <AppStyled class={globals}>
      <HeaderStyled>
        <LogoStyled src={logo} alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <LinkStyled
          href="https://github.com/solidjs/solid"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Solid
        </LinkStyled>
      </HeaderStyled>
    </AppStyled>
  );
};

export default App;
