export default `
function __linariaHasCSSMeta(value) {
  return value && typeof value === 'object' && value?.__linaria?.type === 'css';
}

const __linariaCollectCompose = (strings, ...values) => className => {
  const stylesArr = [];
  let replacements = {};
  let replacementCounter = 0;

  // need to get non-primitive types and then create places for replacements
  // need to pass fileNameHash to identify nested replacements

  strings.forEach((string, index) => {
    // is reference to a class, not prepended with a dot
    stylesArr.push(string);
    if (index < strings.length - 1) {
      const value = values[index];
      if (
        __linariaHasCSSMeta(value) &&
        strings[index].charAt(strings[index].length - 1) !== '.'
      ) {
        replacements = {
          ...replacements,
          ...value.__linaria.composes.replacements,
        };
        stylesArr.push(value.__linaria.composes.styles);
      } else {
        if (typeof value !== 'object' && typeof value !== 'function') {
          stylesArr.push(value);
        } else {
          const replacementID = className + replacementCounter++;
          stylesArr.push('%%' + replacementID + '%%');
          replacements[replacementID] = value;
        }
      }
    }
  });
  return { styles: stylesArr.join(''), replacements };
};
`;
