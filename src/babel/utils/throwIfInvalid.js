/* @flow */

import generator from '@babel/generator';
import isSerializable from './isSerializable';

// Throw if we can't handle the interpolated value
export default function throwIfInvalid(value: any, ex: any) {
  if (
    typeof value === 'function' ||
    typeof value === 'string' ||
    (typeof value === 'number' && Number.isFinite(value)) ||
    isSerializable(value)
  ) {
    return;
  }

  const stringified =
    typeof value === 'object' ? JSON.stringify(value) : String(value);

  throw ex.buildCodeFrameError(
    `The expression evaluated to '${stringified}', which is probably a mistake. If you want it to be inserted into CSS, explicitly cast or transform the value to a string, e.g. - 'String(${
      generator(ex.node).code
    })'.`
  );
}
