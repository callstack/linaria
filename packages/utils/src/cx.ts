export type LinariaClassName = string & { __linariaClassName: true };

export type ClassName<T = string> = T | false | void | null | 0 | '';

interface StyleCollectionObject {
  [key: string]: string;
}

interface ICX {
  (...classNames: ClassName<LinariaClassName>[]): LinariaClassName;
  (...classNames: (ClassName | ClassName<StyleCollectionObject>)[]): string;
}
/**
 * Takes a list of class names and filters for truthy ones, joining them into a single class name for convenience.
 * eg.
 * ```js
 *  cx('red', isBig && 'big') // returns 'red big' if `isBig` is true, otherwise returns 'red'
 * ```
 * If arguments provided are objects, these objects are merged together, and the values are taken as class names:
 *
 * ```js
 *  cx({ color: 'class1', textDecoration: 'class2'}, { color: 'class3' }) // returns `class3 class2`
 * ```
 *
 * @returns the combined, space separated class names that can be applied directly to the class attribute
 */
const cx: ICX = function cx() {
  const presentClassNames = Array.prototype.slice
    .call(arguments)
    .filter(Boolean);

  // In the basic case, `cx` is passed all strings, and we simply need to join them together with space separators
  const classNamesResult: string[] = presentClassNames.filter(
    (arg) => typeof arg !== 'object'
  );

  // There might also be objects (eg. from the atomic API) such as cx('foo', {
  // key1: 'bar', key2: 'fizz'}, { key1: 'buzz' }) the desired behavior is to
  // deduplicate the values based on their properties. The object's values are
  // the class names
  const styleCollectionResult: string[] = Object.values(
    Object.assign(
      {},
      ...presentClassNames.filter((arg) => typeof arg === 'object')
    )
  );
  return [...styleCollectionResult, ...classNamesResult].join(
    ' '
  ) as LinariaClassName;
};

export default cx;
