export { default as css } from './core/css';
export { default as cx } from './core/cx';

type CSSProperties = {
  [key: string]: string | number | CSSProperties;
};

type Inject = (
  _strings: TemplateStringsArray,
  ..._exprs: Array<string | number | CSSProperties>
) => void;

export const injectGlobal: Inject = (_strings, ..._args) => {};
