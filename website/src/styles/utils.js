/* @flow */

export const breakpoints = {
  small: 480,
  medium: 768,
  large: 1200,
  xlarge: 1600,
};

export const media = Object.keys(breakpoints).reduce((acc, item) => {
  acc[item] = `@media screen and (min-width: ${breakpoints[item]}px)`;
  return acc;
}, {});
