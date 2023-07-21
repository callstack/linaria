import { isBoxedPrimitive } from '@linaria/utils';

import type { CSSPropertyValue, CSSable } from '../types';

import { unitless } from './units';

const isCSSPropertyValue = (o: unknown): o is CSSPropertyValue => {
  return (
    isBoxedPrimitive(o) ||
    typeof o === 'string' ||
    (typeof o === 'number' && Number.isFinite(o))
  );
};

export const isCSSable = (o: unknown): o is CSSable => {
  if (isCSSPropertyValue(o)) {
    return true;
  }

  if (Array.isArray(o)) {
    return o.every(isCSSable);
  }

  if (typeof o === 'object') {
    return o !== null && Object.values(o).every(isCSSable);
  }

  return false;
};

const hyphenate = (s: string) => {
  if (s.startsWith('--')) {
    // It's a custom property which is already well formatted.
    return s;
  }
  return (
    s
      // Hyphenate CSS property names from camelCase version from JS string
      .replace(/([A-Z])/g, (match, p1) => `-${p1.toLowerCase()}`)
      // Special case for `-ms` because in JS it starts with `ms` unlike `Webkit`
      .replace(/^ms-/, '-ms-')
  );
};

// Some tools such as polished.js output JS objects
// To support them transparently, we convert JS objects to CSS strings
export default function toCSS(o: CSSable): string {
  if (Array.isArray(o)) {
    return o.map(toCSS).join('\n');
  }

  if (isCSSPropertyValue(o)) {
    return o.valueOf().toString();
  }

  return Object.entries(o)
    .filter(
      ([, value]) =>
        // Ignore all falsy values except numbers
        typeof value === 'number' || value
    )
    .map(([key, value]) => {
      if (!isCSSPropertyValue(value)) {
        return `${key} { ${toCSS(value)} }`;
      }

      return `${hyphenate(key)}: ${
        typeof value === 'number' &&
        value !== 0 &&
        // Strip vendor prefixes when checking if the value is unitless
        !(
          key.replace(
            /^(Webkit|Moz|O|ms)([A-Z])(.+)$/,
            (match, p1, p2, p3) => `${p2.toLowerCase()}${p3}`
          ) in unitless
        )
          ? `${value}px`
          : value
      };`;
    })
    .join(' ');
}
