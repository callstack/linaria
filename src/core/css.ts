// 'csstype' cannot be resolved since 'main' field in its package.json is empty and no script files are exported
// eslint-disable-next-line import/no-unresolved
import * as csstype from 'csstype';
import { StyledMeta } from '../StyledMeta';

// exported so that users can extend the interface by declaration merging
export interface Properties
  extends csstype.Properties,
    csstype.PropertiesHyphen {}

export type CSSProperties =
  | Properties
  | {
      [key: string]: Properties;
    };

export default function css(
  _strings: TemplateStringsArray,
  ..._exprs: Array<string | number | CSSProperties | StyledMeta>
): string {
  throw new Error(
    'Using the "css" tag in runtime is not supported. Make sure you have set up the Babel plugin correctly.'
  );
}
