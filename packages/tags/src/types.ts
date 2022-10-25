import type {
  Expression,
  Identifier,
  TemplateElement,
  MemberExpression,
  BigIntLiteral,
  BooleanLiteral,
  DecimalLiteral,
  NullLiteral,
  NumericLiteral,
  StringLiteral,
} from '@babel/types';

export type StyledMeta = {
  __linaria: {
    className: string;
    extends: StyledMeta;
  };
};

export type CSSPropertyValue = string | number;

export type ObjectWithSelectors = {
  [key: string]:
    | ObjectWithSelectors
    | CSSPropertyValue
    | (ObjectWithSelectors | CSSPropertyValue)[];
};

export type CSSable = ObjectWithSelectors[string];

export type JSONValue =
  | null
  | string
  | number
  | boolean
  | JSONObject
  | JSONArray;

export interface JSONObject {
  [x: string]: JSONValue;
}

export type JSONArray = Array<JSONValue>;

export type Serializable = JSONValue;

export type Value = (() => void) | StyledMeta | CSSable;

export type ValueCache = Map<string | number | boolean | null, unknown>;

export type Artifact = [name: string, data: unknown];

export type Location = {
  column: number;
  line: number;
};

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

export type WrappedNode = string | { node: Identifier; source: string };

export type Rules = Record<string, ICSSRule>;

export type TagParam = readonly ['tag', Identifier | MemberExpression];
export type CallParam = readonly ['call', ...ExpressionValue[]];
export type MemberParam = readonly ['member', string];
export type TemplateParam = readonly [
  'template',
  (TemplateElement | ExpressionValue)[]
];

export type Param = TagParam | CallParam | MemberParam | TemplateParam;
export type Params = readonly Param[];

export type BuildCodeFrameErrorFn = <TError extends Error>(
  msg: string,
  Error?: new (msg: string) => TError
) => TError;

export enum ValueType {
  LAZY,
  FUNCTION,
  CONST,
}

export type LazyValue = {
  buildCodeFrameError: BuildCodeFrameErrorFn;
  ex: Identifier;
  kind: ValueType.LAZY;
  source: string;
};

export type FunctionValue = {
  buildCodeFrameError: BuildCodeFrameErrorFn;
  ex: Identifier;
  kind: ValueType.FUNCTION;
  source: string;
};

export type ConstValue = {
  buildCodeFrameError: BuildCodeFrameErrorFn;
  ex:
    | StringLiteral
    | NumericLiteral
    | NullLiteral
    | BooleanLiteral
    | BigIntLiteral
    | DecimalLiteral;
  kind: ValueType.CONST;
  source: string;
  value: string | number | boolean | null;
};

export type ExpressionValue = LazyValue | FunctionValue | ConstValue;

export type Replacements = Array<{
  length: number;
  original: {
    end: Location;
    start: Location;
  };
}>;
