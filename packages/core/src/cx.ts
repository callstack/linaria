export type ClassName = string | false | void | null | 0;

type CX = (...classNames: ClassName[]) => string;

const cx: CX = function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
};

export default cx;
