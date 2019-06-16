type CSSProperties = {
  [key: string]: string | number | CSSProperties;
};

export default function css(
  _strings: string[],
  ..._exprs: Array<string | number | CSSProperties>
): string {
  throw new Error(
    'Using the "css" or "injectGlobal" tag in runtime is not supported. Have you set up the Babel plugin correctly?'
  );
}
