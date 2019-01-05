/* @flow */

function css() {
  throw new Error(
    'Using the "css" tag in runtime is not supported. Make sure you have set up the Babel plugin correctly.'
  );
}

module.exports = css;

type CSSProperties = {
  [key: string]: string | number | CSSProperties,
};

declare module.exports: (
  strings: string[],
  ...exprs: Array<string | number | CSSProperties>
) => string;
