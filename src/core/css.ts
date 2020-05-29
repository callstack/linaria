type CSSMeta = string;

type CSSProperties = {
  [key: string]: string | number | CSSProperties;
};

export default function css(
  _strings: TemplateStringsArray,
  ..._exprs: Array<string | number | CSSProperties | CSSMeta>
): string {
  throw new Error(
    'Using the "css" tag in runtime is not supported. Make sure you have set up the Babel plugin correctly.'
  );
}
