import type { CSSProperties } from './CSSProperties';
import type { StyledMeta } from './StyledMeta';

export type LinariaClassName = string & { __linariaClassName: true };

type CSS = (
  strings: TemplateStringsArray,
  ...exprs: Array<string | number | CSSProperties | StyledMeta>
) => LinariaClassName;

const css: CSS = () => {
  throw new Error(
    'Using the "css" tag in runtime is not supported. Make sure you have set up the Babel plugin correctly.'
  );
};

export default css;
