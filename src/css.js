/* @flow */

import slugify from './slugify';
import sheet from './sheet';

const all = sheet();

const named = (id?: string) => (
  template: Array<string>,
  ...expressions: Array<string>
) => {
  const styles = template.reduce(
    (accumulator, part, i) => accumulator + expressions[i - 1] + part
  );

  const slug = id || slugify(styles);
  const selector = `.${slug}`;

  all.insert(selector, styles);

  return slug;
};

const css = named();

css.named = named;

export default css;
