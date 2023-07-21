import type { StyledMeta } from '@linaria/utils';

import type { CSSProperties } from './CSSProperties';
import type { LinariaClassName } from './cx';

type CSS = (
  strings: TemplateStringsArray,
  ...exprs: Array<string | number | CSSProperties | StyledMeta>
) => LinariaClassName;

let idx = 0;

const css: CSS = () => {
  if (process.env.NODE_ENV === 'test') {
    // eslint-disable-next-line no-plusplus
    return `mocked-css-${idx++}` as LinariaClassName;
  }

  throw new Error(
    'Using the "css" tag in runtime is not supported. Make sure you have set up the Babel plugin correctly.'
  );
};

export default css;
