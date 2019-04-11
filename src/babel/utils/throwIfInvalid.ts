import generator from '@babel/generator';
import isSerializable from './isSerializable';
import { Serializable } from '../types';

// Throw if we can't handle the interpolated value
function throwIfInvalid(value: Function, ex: any): void;
function throwIfInvalid(value: string, ex: any): void;
function throwIfInvalid(value: number, ex: any): void;
function throwIfInvalid(value: Serializable, ex: any): void;
function throwIfInvalid(value: any, ex: any): never;
function throwIfInvalid(value: any, ex: any): void | never {
  if (
    typeof value === 'function' ||
    typeof value === 'string' ||
    (typeof value === 'number' && Number.isFinite(value)) ||
    isSerializable(value)
  ) {
    return;
  }

  // We can't use instanceof here so let's use duck typing
  if (value && value.stack && value.message) {
    throw ex.buildCodeFrameError(
      `An error occurred when evaluating the expression: ${
        value.message
      }. Make sure you are not using a browser or Node specific API.`
    );
  }

  const stringified =
    typeof value === 'object' ? JSON.stringify(value) : String(value);

  throw ex.buildCodeFrameError(
    `The expression evaluated to '${stringified}', which is probably a mistake. If you want it to be inserted into CSS, explicitly cast or transform the value to a string, e.g. - 'String(${
      generator(ex.node).code
    })'.`
  );
}

export default throwIfInvalid;
