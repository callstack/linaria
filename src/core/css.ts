import type { CSSProperties } from '../CSSProperties';
import type { StyledMeta } from '../StyledMeta';

export default function css(
  _strings: TemplateStringsArray,
  ..._exprs: Array<string | number | CSSProperties | StyledMeta>
): string {
  throw new Error(
    'Using the "css" tag in runtime is not supported. Make sure you have set up the Babel plugin correctly.'
  );
}
