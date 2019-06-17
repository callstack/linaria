type CSSProperties = {
  [key: string]: string | number | CSSProperties;
};

// Override css return type for TS
type CssFn = (
  _strings: TemplateStringsArray,
  ..._exprs: Array<string | number | CSSProperties>
) => string;

function css(
  _strings: TemplateStringsArray,
  ..._exprs: Array<string | number | CSSProperties>
): void {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(
      'Using the "css" or "injectGlobal" tag in runtime is not supported. Have you set up the Babel plugin correctly?'
    );
  }
}

export default css as CssFn;
