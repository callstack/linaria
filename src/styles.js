/* @flow */

const names = require('./names');

/* ::
import type { ClassName } from './names';
*/

function styles(
  ...classNames /* : ClassName[] */
) /* : { className: string } */ {
  return {
    className: names(...classNames),
  };
}

module.exports = styles;
