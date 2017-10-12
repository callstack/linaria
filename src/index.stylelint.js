/* @flow */

import dedent from 'dedent';

// Custom implementation of css.named for stylelint.
function cssNamed() {
  return (template: string[], ...expressions: string[]) => {
    const styles = dedent(
      template,
      ...expressions.map(expression => String(expression).replace('\n', ' '))
    ).trim();

    process.emit('linaria-extract', { styles });

    return '';
  };
}

export const css = cssNamed();

css.named = cssNamed;

export { default as include } from './include';
export { default as names } from './names';
export { default as styles } from './styles';
