import css from '../../build/css';

import constants from '../fixtures/constants.esm';
import multiply from '../fixtures/multiply';

const header = css`
  color: '#ffffff';
  font-size: ${multiply(constants.fontSize, 1.5)}px;
`;

const title = css`
  color: '#ffffff';
  font-size: ${multiply(24, 0.5)}px;
`;
