/* @flow */

import stylis from 'stylis';

type RawStyles = {
  template: string[],
  expressions: string[],
  classname: string,
};

function sheet() {
  let cache: { [selector: string]: string } = {};
  const rawCache: { [selector: string]: RawStyles[] } = {};

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
    insertRaw({
      filename,
      template,
      expressions,
      classname,
    }: RawStyles & { filename: ?string }) {
      if (filename && process.env.LINARIA_COLLECT_RAW_STYLES) {
        rawCache[filename] = (rawCache[filename] || [])
          .concat({ template, expressions, classname });
      }
    },
    insert(selector: string, css: string) {
      if (selector in cache) {
        return;
      }

      const text = stylis(selector, css);
      cache[selector] = css;
      node.appendData(`\n${text}`);
    },
    rawStyles() {
      return rawCache;
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
