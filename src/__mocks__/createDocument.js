/* @flow */

const createDocument = () => {
  const __elements = [];

  function createElement(tag: string) {
    const element = {
      __type: tag,
      children: [],
      attributes: {},
      appendChild(el: *) {
        this.children.push(el);
      },
      setAttribute(name: string, value: string) {
        this.attributes[name] = value;
      },
    };
    __elements.push(element);
    return element;
  }

  function createTextNode(text: string) {
    return {
      __text: [text],
      appendData(t: string) {
        this.__text.push(t);
      },
    };
  }

  return {
    createElement,
    createTextNode,
    get styleSheets() {
      return this.head.children.filter(el => el.__type === 'style').map(el => ({
        cssRules: []
          .concat(...el.children.map(c => c.__text))
          .filter(t => /^.+\{.+\}$/.test(t))
          .map(t => ({ selector: t.split('{')[0].trim(), cssText: t })),
      }));
    },
    head: createElement('head'),
  };
};

export default createDocument;
