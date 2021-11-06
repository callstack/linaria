import { StyleCollectionObject } from './css';

interface ICX {
  (
    ...classNames: (
      | StyleCollectionObject
      | string
      | false
      | void
      | null
      | 0
      | ''
    )[]
  ): string;
}

const cx: ICX = function cx(...rest) {
  let combinedAtoms = {};
  let classNames: string[] = [];
  rest.forEach((c) => {
    if (typeof c === 'object') {
      combinedAtoms = Object.assign(combinedAtoms, c);
    } else if (c) {
      classNames.push(c);
    }
  });
  return [...Object.values(combinedAtoms), ...classNames].join(' ');
};

export default cx;
