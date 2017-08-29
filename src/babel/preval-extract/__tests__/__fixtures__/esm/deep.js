import constants from './constants';
import { multiply } from '../commonjs/utils';

export default {
  fontSize: `${multiply(parseInt(constants.fontSize.replace('px', ''), 10))}px`,
};
