/* @flow */

import stylis from 'stylis';

function sheet() {
  let ruleCache: ?Array<{
    selectorText: string,
    cssText: string,
    style: Object,
  }>;
  let cache: { [selector: string]: string } = {};
  let cssText = '';

  if (typeof window === 'undefined' || typeof window.document === 'undefined') {
    return {
      insert(selector: string, css: string) {
        if (cache.hasOwnProperty(selector)) {
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

  return {
    insert(selector: string, css: string) {
      if (cache.hasOwnProperty(selector)) {
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
  };
}

export default sheet();
