import css from '../../build/css';

const theme = {
  vibrant: {
    fontColor: '#ffffff',
  },
};
const base = { fontSize: '14px' };
const getTheme = name => theme[name];
const getConstants = () => ({ ...base, ...getTheme('vibrant') });

const header = css`
  color: ${getConstants().fontColor};
  font-size: ${getConstants().fontSize};
`;
