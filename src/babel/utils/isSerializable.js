/* @flow */

export default function isSerializable(o: any) {
  return (
    (Array.isArray(o) && o.every(isSerializable)) ||
    (typeof o === 'object' && o != null && o.constructor.name === 'Object')
  );
}
