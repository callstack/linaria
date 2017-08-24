import css from '../../build/css';

const constants = {
  color: '#ffffff',
  fontSize: '28px',
};

function multiply(value, by) {
  return value * by;
}

const header = css`
  color: ${constants.color};
  font-size: ${multiply(constants.fontSize, 1.5)}px;
`;

const title = css`
  color: ${constants.color};
  font-size: ${multiply(24, 0.5)}px;
`;
