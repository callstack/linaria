import type { LinariaClassName } from '@linaria/core';

import type { CSSProperties } from './CSSProperties';

type CSS = (
  strings: TemplateStringsArray,
  ...exprs: Array<string | number | CSSProperties>
) => LinariaClassName;

let idx = 0;

export const css: CSS = () => {
  if (process.env.NODE_ENV === 'test') {
    // eslint-disable-next-line no-plusplus
    return `mocked-atomic-css-${idx++}` as LinariaClassName;
  }

  throw new Error(
    'Using the "css" tag in runtime is not supported. Make sure you have set up the Babel plugin correctly.'
  );
};

export default css;
