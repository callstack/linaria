/* @flow */

export type ClassName = string | false | void | null | 0;

function cx(...classNames: ClassName[]): string {
  return classNames.filter(Boolean).join(' ');
}

module.exports = cx;
