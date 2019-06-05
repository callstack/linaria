import camelCase from 'camelcase';
/**
 * Generate a BEM-like name from a conditional modifier.
 * We take the paramText and generate a stringified BEM classname
 * - props => props.primary //-->// primary
 * - props => props.size === 'large' //-->// size-large
 * - props => props.round && props.size !== 'small' //-->// --round-and-size-not-small
 * - It is expected that the generated class will be appended to the main className with a `--` leader.
 * These long names are useful in development but can be minimized for production.
 */
export default function generateModifierName(
  paramName = 'props',
  bodyText: string
): string {
  let replacements = [
    ['!==', '-is-not-'],
    ['!=', '-is-not-'],
    ['===', '-is-'],
    ['==', '-is-'],
    ['&&', '-and-'],
    ['||', '-or-'],
    ['!!', '-is-'],
    ['!', '-not-'],
    // Use a single quote type for easier "parsing"
    ["'", '"'], // single to double
    ['`', '"'], // template to double
  ];
  // Remove lines and tab chars:
  let str = bodyText
    .replace(/[\r\n]+/g, '-')
    .replace(/\t+/g, '')
    .trim();

  // Remove spaces not quoted
  str
    .replace(/([^"]+)|("[^"]+")/g, spaceReplacer)
    .replace(/([^`]+)|(`[^`]+`)/g, spaceReplacer)
    .replace(/([^']+)|('[^']+')/g, spaceReplacer);

  // replace logic operators with words:
  replacements.forEach(r => {
    bodyText.replace(r[0], r[1]);
  });

  // camelCase strings in quotes (to support spaces)
  str.replace(/"(.*?)"/, ($0, $1) => {
    return $0.replace(/.*/, `"${camelCase($1)}"`);
  });

  // Remove parameter name for shorter dev classnames
  const propRegex = new RegExp(paramName + '(\\.|\\[)', 'g');
  str.replace(propRegex, '');

  // Remove all special characters
  str.replace(/[^\w-]/g, '');

  // Remove duplicate dashes
  str.replace(/--+/g, '');
  // Remove leading is
  str.replace(/^-is-/, '');
  // Simplify short classnames `type-is-primary` -> `type-primary`
  // Count logic operators
  let count = 0;
  for (let i = 0; count > 1 || i === replacements.length; i += 1) {
    let find = replacements[i];
    const re = new RegExp(find[1], 'g');
    const subCount = (str.match(re) || []).length;
    count += subCount;
  }
  if (count === 1) {
    str.replace('-is-', '-');
  }

  return str.trim();
}

function spaceReplacer(_: string, $1: string, $2: string) {
  if ($1) {
    return $1.replace(/\s/g, '');
  } else {
    return $2;
  }
}
