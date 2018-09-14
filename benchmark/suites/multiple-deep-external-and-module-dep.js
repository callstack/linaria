import css from '../../build/css';
import constants from '../fixtures/constants.esm';
import multiply from '../fixtures/multiply';

const theme = {
  vibrant: {
    fontColor: '#ffffff',
  },
};
const base = { fontSize: '14px' };
const getTheme = name => theme[name];
const getLocalConstants = () => ({ ...base, ...getTheme('vibrant') });

const button = css`
  font-size: ${getLocalConstants().fontSize};
  color: ${getLocalConstants().fontColor};
  text-decoration: none;
  border-radius: ${multiply(3, 2)}px;
  border: 2px solid white;
  background-color: transparent;
  margin: 1rem;
  padding: .5rem 1rem;
  transition: 200ms ease-in;

  &:hover {
    background-color: white;
    color: ${constants.color};
  }
`;
