// There is a problem with using boxed numbers and strings in TS,
// so we cannot just use `instanceof` here

const constructors = ['Number', 'String'];
export function isBoxedPrimitive(o: unknown): o is number | string {
  if (typeof o !== 'object' || o === null) return false;
  return (
    constructors.includes(o.constructor.name) &&
    typeof o?.valueOf() !== 'object'
  );
}
