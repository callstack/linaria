/* @flow */

import dedent from 'dedent';
import slugify from './slugify';
import sheet from './sheet';

const named = (name?: string = 'css') => (
  template: string[],
  ...expressions: string[]
) => {
  const styles = dedent(template, ...expressions).trim();
  const slug = slugify(styles);
  const classname = `${name}_${slug}`;

  sheet.insert(`.${classname}`, styles);

  return classname;
};

const css = named();

css.named = named;

export default css;
