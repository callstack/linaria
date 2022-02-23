export type LinariaClassName = string & { __linariaClassName: true };

export type ClassName<T = string> = T | false | void | null | 0 | '';

interface ICX {
  (...classNames: (ClassName | ClassName<LinariaClassName>)[]): string;
}
/**
 * Takes a list of class names and filters for truthy ones, joining them into a single class name for convenience.
 * eg.
 * ```js
 *  cx('red', isBig && 'big') // returns 'red big' if `isBig` is true, otherwise returns 'red'
 * ```
 * If space separated atomic styles are provided, they are deduplicated according to the first hashed valued:
 *
 * ```js
 *  cx('atm_a_class1 atm_b_class2', 'atm_a_class3') // returns `atm_a_class3 atm_b_class2`
 * ```
 *
 * @returns the combined, space separated class names that can be applied directly to the class attribute
 */
const cx: ICX = function cx() {
  const presentClassNames = Array.prototype.slice
    .call(arguments)
    .filter(Boolean);

  const atomicClasses: { [k: string]: string } = {};
  const nonAtomicClasses = [];
  for (const className of presentClassNames) {
    // className could be the output of a previous cx call, so split by ' ' first
    const individualClassNames = className.split(' ');

    for (const className of individualClassNames) {
      if (className.startsWith('atm_')) {
        const [, keyHash] = className.split('_');
        atomicClasses[keyHash] = className;
      } else {
        nonAtomicClasses.push(className);
      }
    }
  }

  return [...Object.values(atomicClasses), ...nonAtomicClasses].join(
    ' '
  ) as LinariaClassName;
};

export default cx;
