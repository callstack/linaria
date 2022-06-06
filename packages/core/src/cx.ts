export type LinariaClassName = string & { __linariaClassName: true };

export type ClassName<T = string> = T | false | void | null | 0 | '';

interface ICX {
  (...classNames: ClassName<LinariaClassName>[]): LinariaClassName;
  (...classNames: ClassName[]): string;
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
  const presentClassNames: (ClassName | ClassName<LinariaClassName>)[] =
    Array.prototype.slice
      // eslint-disable-next-line prefer-rest-params
      .call(arguments)
      .filter(Boolean);

  const atomicClasses: { [k: string]: string } = {};
  const nonAtomicClasses: string[] = [];
  presentClassNames.forEach((arg) => {
    // className could be the output of a previous cx call, so split by ' ' first
    const individualClassNames = arg ? arg.split(' ') : [];

    individualClassNames.forEach((className) => {
      if (className.startsWith('atm_')) {
        const [, keyHash] = className.split('_');
        atomicClasses[keyHash] = className;
      } else {
        nonAtomicClasses.push(className);
      }
    });
  });

  const result: string[] = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const keyHash in atomicClasses) {
    if (Object.prototype.hasOwnProperty.call(atomicClasses, keyHash)) {
      result.push(atomicClasses[keyHash]);
    }
  }

  result.push(...nonAtomicClasses);

  return result.join(' ') as LinariaClassName;
};

export default cx;
