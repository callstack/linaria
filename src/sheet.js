/* @flow */

import stylis from 'stylis';

export default function sheet() {
  if (typeof window === 'undefined' || typeof window.document === 'undefined') {
    // noop in non-browser environment
    return { insert: () => {} };
  }

  const style = document.createElement('style');
  style.appendChild(document.createTextNode(''));
  style.setAttribute('type', 'text/css');

  if (document.head != null) {
    document.head.appendChild(style);
  } else {
    throw new Error('Unable to insert stylesheet');
  }

  return {
    insert: (selector: string, styles: string) => {
      const rules = stylis(selector, styles);

      if (
        style.sheet &&
        typeof style.sheet.insertRule === 'function' &&
        Array.isArray(style.sheet.rules)
      ) {
        style.sheet.insertRule(rules, style.sheet.rules.length);
      } else {
        style.appendChild(document.createTextNode(rules));
      }
    },
  };
}
