/* @flow */

import stylis from 'stylis';

function sheet() {
  let ruleCache: ?Array<CSSRule>;
  let cssText: ?string;
  let stylesCache: ?Array<{ selector: string, css: string }>;

  if (typeof window === 'undefined' || typeof window.document === 'undefined') {
    return {
      append(selector: string, css: string) {
        stylesCache = stylesCache || [];
        stylesCache.push({ selector, css });
        this.insert(stylis(selector, css));
      },
      insert: (text: string) => {
        cssText = cssText ? cssText + text : text;
      },
      rules: () => {
        throw new Error('Not implemented');
      },
      styles: () => stylesCache || [],
      dump: () => {
        const result = cssText || '';
        cssText = null;
        stylesCache = null;
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
    append(selector: string, css: string) {
      this.insert(stylis(selector, css));
    },
    insert: (text: string) => {
      node.appendData(text);
      // invalidate the cache since stylesheets have changed
      ruleCache = null;
    },
    rules: () => {
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
