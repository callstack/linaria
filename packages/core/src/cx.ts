import { LinariaClassName } from './css';

export type ClassName<T = string> = T | false | void | null | 0 | '';

interface ICX {
  (...classNames: ClassName<LinariaClassName>[]): LinariaClassName;
  (...classNames: ClassName[]): string;
}

const cx: ICX = function cx() {
  const result = Array.prototype.slice
    .call(arguments)
    .filter(Boolean)
    .join(' ');
  return result as LinariaClassName;
};

export default cx;
