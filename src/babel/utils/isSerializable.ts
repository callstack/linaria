import type { Serializable } from '../types';
import isBoxedPrimitive from './isBoxedPrimitive';

export default function isSerializable(o: any): o is Serializable {
  return (
    (Array.isArray(o) && o.every(isSerializable)) ||
    (typeof o === 'object' &&
      o !== null &&
      (o.constructor.name === 'Object' || isBoxedPrimitive(o)))
  );
}
