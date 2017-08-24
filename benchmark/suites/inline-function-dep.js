import css from '../../build/css';

function multiply(value, by) {
  return value * by;
}

const header = css`
  color: '#ffffff';
  font-size: ${multiply(24, 1.5)}px;
`;

const title = css`
  color: '#ffffff';
  font-size: ${multiply(24, 0.5)}px;
`;
