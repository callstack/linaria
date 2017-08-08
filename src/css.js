/* @flow */

import slugify from './slugify';
import sheet from './sheet';

const named = (id?: string) => (
  template: Array<string>,
  ...expressions: Array<string>
) => {
  const styles = template.reduce(
    (accumulator, part, i) => accumulator + expressions[i - 1] + part
  );

  const slug = id || `css-${slugify(styles)}`;
  const selector = `.${slug}`;

  sheet.append(selector, styles);

  return slug;
};

const css = named();

css.named = named;

export default css;
