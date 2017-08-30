import normalize from 'normalize.css';
import theme from './theme';

export default `
  ${normalize.toString()}

  html {
    font-family: ${theme.fontFamily};
  }
`;
