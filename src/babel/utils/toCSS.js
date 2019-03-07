/* @flow */

import isSerializable from './isSerializable';
import { unitless } from '../units';

const hyphenate = (s: string) =>
  s
    // Hyphenate CSS property names from camelCase version from JS string
    .replace(/([A-Z])/g, (match, p1) => `-${p1.toLowerCase()}`)
    // Special case for `-ms` because in JS it starts with `ms` unlike `Webkit`
    .replace(/^ms-/, '-ms-');

type CSSProperties =
  | CSSProperties[]
  | {
      [key: string]: string | number | CSSProperties,
    };

// Some tools such as polished.js output JS objects
// To support them transparently, we convert JS objects to CSS strings
export default function toCSS(o: CSSProperties) {
  if (Array.isArray(o)) {
    return o.map(toCSS).join('\n');
  }

  return Object.entries(o)
    .filter(
      ([, value]) =>
        // Ignore all falsy values except numbers
        typeof value === 'number' || value
    )
    .map(([key, value]) => {
      if (isSerializable(value)) {
        return `${key} { ${toCSS((value: any))} }`;
      }

      return `${hyphenate(key)}: ${
        /* $FlowFixMe */
        typeof value === 'number' &&
        value !== 0 &&
        !unitless[
          // Strip vendor prefixes when checking if the value is unitless
          key.replace(
            /^(Webkit|Moz|O|ms)([A-Z])(.+)$/,
            (match, p1, p2, p3) => `${p2.toLowerCase()}${p3}`
          )
        ]
          ? `${value}px`
          : value
      };`;
    })
    .join(' ');
}
