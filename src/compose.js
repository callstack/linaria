/* @flow */

import sheet from './sheet';

const cache: { [key: string]: boolean } = {};

export default function compose(...classNames: Array<string | false | void>) {
  const names: Array<string> = (classNames: any).filter(name => name);

  if (names.length === 1) {
    return names[0];
  }

  const className = names.join(' ');

  if (cache[className]) {
    return className;
  }

  const rules = sheet.rules();
  const selectors = [].concat(
    ...rules.map(rule =>
      /* $FlowFixMe */
      rule.selectorText
        .split(',')
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
      rules.forEach(rule => {
        /* $FlowFixMe */
        const { selectorText, cssText } = rule;
        if (selectorText.split(':')[0] === selector) {
          sheet.insert(
            cssText.replace(selectorText, `${lastSelector}${selectorText}`)
          );
        }
      });
    }

    lastSelector = selector;
    lastNumber = currentNumber;
  }

  cache[className] = true;

  return className;
}
