/**
 * It's annoying we have to write this, but document.styleSheets returns an empty array in JSDOM
 *
 * @flow
 */

class TextNode {
  constructor(text: string) {
    this.textContent = text;
    this.nodeName = '#text';
  }

  textContent: string;
  parent: any;
  nodeName: string;

  appendData(t: string) {
    if (this.parent instanceof HTMLStyleElement && t.includes('{')) {
      this.parent.__rules.push(t);
    }

    this.textContent += t;
  }
}

class HTMLElement {
  constructor(tag: string) {
    this.tagName = tag.toUpperCase();
    this.nodeName = tag.toUpperCase();
    this.children = [];
    this.attributes = {};
  }

  tagName: string;
  nodeName: string;
  children: any;
  attributes: Object;

  get textContent(): string {
    return this.children.map(c => c.textContent).join('');
  }

  appendChild(el: *) {
    el.parent = this; // eslint-disable-line no-param-reassign
    this.children.push(el);
  }

  setAttribute(name: string, value: string) {
    this.attributes[name] = value;
  }
}

class HTMLStyleElement extends HTMLElement {
  constructor(tag: string) {
    super(tag);
    this.__rules = [];
  }

  __rules: string[];
}

const document = {
  createElement(tag: string) {
    if (tag === 'style') {
      return new HTMLStyleElement(tag);
    }
    return new HTMLElement(tag);
  },
  createTextNode(text: string) {
    return new TextNode(text);
  },
  get styleSheets() {
    return this.head.children
      .filter(el => el instanceof HTMLStyleElement)
      .map(el => {
        const cssRules = el.__rules.map((cssText, i) => ({
          get selectorText() {
            return this.cssText.split('{')[0].trim();
          },

          set selectorText(text: string) {
            this.cssText = `${text}{${cssText.split('{')[1]}`;
            el.__rules[i] = this.cssText; // eslint-disable-line no-param-reassign
          },

          cssText,
        }));

        return { cssRules };
      });
  },
  head: new HTMLElement('head'),
};

export default document;
