export const breakpoints = {
  medium: 640,
  large: 1024,
};

export const media = Object.keys(breakpoints).reduce((acc, item) => {
  acc[item] = `@media screen and (min-width: ${breakpoints[item]}px)`;
  return acc;
}, {});
