import type { CSSProperties } from './CSSProperties';

export interface StyleCollectionObject {
  [key: string]: string;
}

type CSS = (
  strings: TemplateStringsArray,
  ...exprs: Array<string | number | CSSProperties>
) => StyleCollectionObject;

export const css: CSS = () => {
  throw new Error(
    'Using the "css" tag in runtime is not supported. Make sure you have set up the Babel plugin correctly.'
  );
};

export default css;
