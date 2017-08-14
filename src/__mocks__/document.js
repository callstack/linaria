/**
 * It's annoying we have to write this, but document.styleSheets returns an empty array in JSDOM
 *
 * @flow
 */

import CSSOM from 'cssom'; // eslint-disable-line import/no-extraneous-dependencies

class Text {
  constructor(text: string) {
    this.textContent = text;
    this.nodeName = '#text';
  }

  textContent: string;
  parent: any;
  nodeName: string;

  appendData(t: string) {
    if (this.parent instanceof HTMLStyleElement) {
      const ast = CSSOM.parse(t);
      this.parent.__ast.cssRules.push(...ast.cssRules);
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
    this.__ast = CSSOM.parse('');
  }

  __ast: Object;
}

const document = {
  createElement(tag: string) {
    if (tag === 'style') {
      return new HTMLStyleElement(tag);
    }
    return new HTMLElement(tag);
  },
  createTextNode(text: string) {
    return new Text(text);
  },
  get styleSheets() {
    return this.head.children
      .filter(el => el instanceof HTMLStyleElement)
      .map(el => el.__ast);
  },
  head: new HTMLElement('head'),
};

export default document;
