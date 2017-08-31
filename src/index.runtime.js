/* @flow */

export { default as names } from './names';
export { default as styles } from './styles';

const createError = id =>
  new Error(
    `Looks like you tried to use ${id} from 'linaria' in runtime, but it's not supported.`
  );

export function css() {
  throw createError('css');
}

css.named = () => {
  throw createError('css.named');
};

css.include = () => {
  throw createError('css.include');
};

export function include() {
  throw createError('include');
}
