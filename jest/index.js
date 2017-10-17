const prettier = require('prettier');

const KEY = Symbol('linaria-jest');
const CLASS_HTML_PATTERN = /class|className="([^"]+)"/;
const CLASS_CSS_PATTERN = /(css__.*) /g;
const classNamesMap = {};

let counter = 0xa0;

const getNodes = (node, nodes = []) => {
  if (typeof node === 'object') {
    nodes.push(node);
  }
  if (node.children) {
    node.children.forEach(child => getNodes(child, nodes));
  }
  return nodes;
};

const markNodes = nodes =>
  nodes.forEach(node => {
    node[KEY] = true; // eslint-disable-line no-param-reassign
  });

const getCodeWithEnhancedClassNames = val => {
  const styleSheet = document.querySelector('style').innerHTML;
  let css = prettier.format(styleSheet, { parser: 'scss' });
  let printedVal = val;
  let match;

  // eslint-disable-next-line no-cond-assign
  while ((match = CLASS_CSS_PATTERN.exec(css))) {
    classNamesMap[(counter++).toString(16)] = match[1];
  }

  Object.keys(classNamesMap).forEach(name => {
    css = css.replace(new RegExp(classNamesMap[name], 'g'), name);
    printedVal = printedVal.replace(new RegExp(classNamesMap[name], 'g'), name);
  });

  return { css, printedVal };
};

const reactSerializer = {
  print: (val, print) => {
    markNodes(getNodes(val));
    const { css, printedVal } = getCodeWithEnhancedClassNames(print(val));
    return `${css}${css ? '\n' : ''}${printedVal}`;
  },
  test: val =>
    val && !val[KEY] && val.$$typeof === Symbol.for('react.test.json'),
};

const preactSerializer = {
  print: val => {
    const { css, printedVal } = getCodeWithEnhancedClassNames(val);
    return `${css}${css ? '\n' : ''}${printedVal}`;
  },
  test: val => val && CLASS_HTML_PATTERN.test(val),
};

module.exports = {
  reactSerializer,
  preactSerializer,
};
