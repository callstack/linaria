/* @flow */

import slugify from './slugify';
import sheet from './sheet';

const all = sheet();
const cache = [];

const named = (id?: string, createSlug?: boolean = false) => (
  template: string[],
  ...expressions: string[]
) => {
  const styles = template.reduce(
    (accumulator, part, i) => accumulator + expressions[i - 1] + part
  );

  const slug = `${id || slugify(styles)}${createSlug && id
    ? `_${slugify(styles)}`
    : ''}`;
  const selector = `.${slug}`;

  all.insert(selector, styles);
  cache.push({ selector, styles });

  return slug;
};

const css = named();

css.title = id => named(id, true);
css.named = named;

export default css;

export const getCache = () => cache;
