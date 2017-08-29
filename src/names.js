/* @flow */

type ClassName = string | false | void | null | 0;

export default function names(...classNames: ClassName[]): string {
  return classNames.filter(Boolean).join(' ');
}
