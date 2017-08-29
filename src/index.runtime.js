export { default as names } from './names';

const createError = id =>
  new Error(
    `No implementation provided for the Linaria's function ${id} - ` +
      'this function is not intended to be used in runtime.'
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
