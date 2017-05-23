/* @flow */

import shortid from 'shortid';
import sheet from './sheet';

const all = sheet();

const named = (id = shortid(), name) => (template, ...expressions) => {
  const styles = template.reduce(
    (accumulator, part, i) => accumulator + expressions[i - 1] + part
  );

  const selector = name ? `.${name}[data-css~=${id}]` : `.${id}`;

  all.insert(selector, styles);

  return id || name;
};

const css = (...args) => named()(...args);

css.named = named;

export default css;
