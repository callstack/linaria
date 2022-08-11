import { css } from 'linaria';

export const GlobalStyle = css`
  :global() {
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Poppins', sans-serif;
      background: #333;
      color: #f1f1f1;
    }
  }
`;
