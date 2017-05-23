/* @flow */

import slugify from './slugify';
import sheet from './sheet';

const all = sheet();

const named = (id?: string, name?: string) => (
  template: Array<string>,
  ...expressions: Array<string>
) => {
  const styles = template.reduce(
    (accumulator, part, i) => accumulator + expressions[i - 1] + part
  );

  const slug = id || slugify(styles);
  const selector = name ? `.${name}[data-css~=${slug}]` : `.${slug}`;

  all.insert(selector, styles);

  return slug || name;
};

const css = named();

css.named = named;

export default css;
