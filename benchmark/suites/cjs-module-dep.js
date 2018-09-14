import css from '../../build/css';

const constants = require('../fixtures/constants.cjs');

const header = css`
  color: ${constants.color};
  font-size: ${constants.fontSize};
`;

const title = css`
  color: ${constants.color};
  font-size: 24px;
`;
