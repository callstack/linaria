/* @flow */

import sheet from './sheet';

type ClassName = string | false | void;

const cache: { [key: string]: boolean } = {};

export default function compose(...classNames: ClassName[]) {
  const names: string[] = (classNames.filter(Boolean): any)
    .join(' ')
    .split(' ');

  if (names.length === 1) {
    return names[0];
  }

  const className = names.join(' ');

  if (cache[className]) {
    return className;
  }

  const rules = sheet.rules();
  const selectors = [].concat(
    ...rules.list.map(rule =>
      /* $FlowFixMe */
      rule.selectorText
        .split(',')
        .map(c => c.trim())
        .filter(c =>
          /^\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)(?![^{]*\})(:[^\s]+)?$/.test(c)
        )
    )
  );

  let lastSelector;
  let lastNumber;

  for (let i = 0, l = names.length; i < l; i++) {
    const selector = `.${names[i]}`;
    const currentNumber = selectors.indexOf(selector);

    if (typeof lastNumber === 'number' && lastNumber > currentNumber) {
      /* eslint-disable no-loop-func */
      rules.list.forEach(rule => {
        /* $FlowFixMe */
        const { selectorText } = rule;
        if (selectorText.split(':')[0] === selector) {
          /* $FlowFixMe */
          rule.selectorText += `,${lastSelector}${selectorText}`; // eslint-disable-line no-param-reassign
        }
      });
    }

    lastSelector = selector;
    lastNumber = currentNumber;
  }

  cache[className] = true;

  return className;
}
