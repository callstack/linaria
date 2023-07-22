import type {
  Expression,
  Identifier,
  TemplateElement,
  MemberExpression,
} from '@babel/types';

import type { ExpressionValue, Location, StyledMeta } from '@linaria/utils';

export type CSSPropertyValue = string | number;

export type ObjectWithSelectors = {
  [key: string]:
    | ObjectWithSelectors
    | CSSPropertyValue
    | (ObjectWithSelectors | CSSPropertyValue)[];
};

export type CSSable = ObjectWithSelectors[string];

export type Value = (() => void) | StyledMeta | CSSable;

export type ValueCache = Map<string | number | boolean | null, unknown>;

export interface ICSSRule {
  atom?: boolean;
  className: string;
  cssText: string;
  displayName: string;
  start: Location | null | undefined;
}

export interface IInterpolation {
  id: string;
  node: Expression;
  source: string;
  unit: string;
}

export type WrappedNode =
  | string
  | { node: Identifier; nonLinaria?: true; source: string };

export type Rules = Record<string, ICSSRule>;

export type CalleeParam = readonly ['callee', Identifier | MemberExpression];
export type CallParam = readonly ['call', ...ExpressionValue[]];
export type MemberParam = readonly ['member', string];
export type TemplateParam = readonly [
  'template',
  (TemplateElement | ExpressionValue)[]
];

export type Param = CalleeParam | CallParam | MemberParam | TemplateParam;
export type Params = readonly Param[];
