/* @flow */

import stylis from 'stylis';

function sheet() {
  let ruleCache: ?Array<{
    selectorText: string,
    cssText: string,
    style: Object,
  }>;
  let cache: { [selector: string]: string } = {};
  let cssText = null;

  if (typeof window === 'undefined' || typeof window.document === 'undefined') {
    return {
      insert(selector: string, css: string) {
        if (selector in cache) {
          return;
        }

        const text = stylis(selector, css);
        cache[selector] = css;
        cssText = cssText ? `${cssText}\n${text}` : text;
      },
      rules() {
        throw new Error('Not implemented');
      },
      styles() {
        return cache;
      },
      dump() {
        const result = cssText || '';
        cssText = null;
        cache = {};
        return result;
      },
    };
  }

  const style = document.createElement('style');
  const node = document.createTextNode('');

  style.appendChild(node);
  style.setAttribute('type', 'text/css');

  if (document.head != null) {
    document.head.appendChild(style);
  } else {
    throw new Error('Unable to insert stylesheet');
  }

  if (process.env.NODE_ENV !== 'test') {
    console.warn(
      'Babel preset for Linaria is not configured. See https://github.com/callstack-io/linaria/blob/master/docs/BABEL_PRESET.md for instructions.'
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
      // invalidate the cache since stylesheets have changed
      ruleCache = null;
    },
    rules() {
      if (ruleCache != null) {
        return { list: ruleCache, cache: true };
      }

      ruleCache = [].concat(
        /* $FlowFixMe */
        ...Array.from(document.styleSheets).map(s => Array.from(s.cssRules))
      );

      return { list: ruleCache, cache: false };
    },
    styles() {
      return cache;
    },
    dump() {
      throw new Error('Not implemented');
    },
  };
}

export default sheet();
