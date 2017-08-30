export { default as names } from './names';

const createError = id =>
  new Error(
    `Looks like you tried to use ${id} from 'linaria' in runtime, but it is not supported.`
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
