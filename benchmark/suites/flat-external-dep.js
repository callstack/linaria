import css from '../../build/css';

const base = { fontSize: '14px' };
const getConstants = () => Object.assign({}, base);

const header = css`
  font-size: ${getConstants().fontSize}
`;
