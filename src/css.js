/* @flow */

import slugify from './slugify';
import sheet from './sheet';

const named = (name?: string = 'css') => (
  template: string[],
  ...expressions: string[]
) => {
  const styles = template.reduce(
    (accumulator, part, i) => accumulator + expressions[i - 1] + part
  );

  const slug = slugify(styles);
  const classname = `${name}_${slug}`;

  sheet.append(`.${classname}`, styles);

  return classname;
};

const css = named();

css.named = named;

export default css;
