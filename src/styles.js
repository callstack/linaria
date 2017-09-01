/* @flow */

import names from './names';
import type { ClassName } from './names';

export default function styles(
  ...classNames: ClassName[]
): { className: string } {
  return {
    className: names(...classNames),
  };
}
