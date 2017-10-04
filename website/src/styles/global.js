import theme from './theme';

export default `
  html {
    box-sizing: border-box;
    height: 100%;
    width: 100%;
    color: ${theme.text};
    font-family: ${theme.fontFamily};
    font-weight: 300;
    font-size: 16px;
    line-height: 1.4;
  }

  body {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
  }

  *, *:before, *:after {
    box-sizing: inherit;
  }
`;
