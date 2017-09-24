/* @flow */

import stylis from 'stylis';

function sheet() {
  let cache: { [selector: string]: string } = {};

  const isBrowser =
    typeof window === 'object' && window != null && window.document != null;
  // eslint-disable-next-line global-require
  const document = isBrowser ? window.document : require('./document').default;

  const style = document.createElement('style');
  const node = document.createTextNode('');

  style.appendChild(node);
  style.setAttribute('type', 'text/css');

  document.head.appendChild(style);

  if (process.env.NODE_ENV !== 'test' && isBrowser) {
    console.warn(
      'Babel preset for Linaria is not configured. See https://github.com/callstack/linaria/blob/master/docs/BABEL_PRESET.md for instructions.'
    );
  }

  return {
    insert(selector: string, css: string) {
      if (selector in cache) {
        return;
      }

      const text = stylis(selector, css);
      cache[selector] = css;
      node.appendData(`\n${text}`);
    },
    styles() {
      return cache;
    },
    dump() {
      const result = node.textContent;
      cache = {};
      node.textContent = '';
      return result.trim();
    },
  };
}

export default sheet();
