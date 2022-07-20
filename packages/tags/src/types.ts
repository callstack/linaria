import type { Expression, Identifier } from '@babel/types';

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

export type ValueCache = Map<string, unknown>;

export type Artifact = [name: string, data: unknown];

export type Location = {
  column: number;
  line: number;
};

export interface IPlaceholder {
  id: string;
  resolver: () => string;
}

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

export type CallParam = ['call', ...ExpressionValue[]];
export type MemberParam = ['member', string];

export type Params = (CallParam | MemberParam)[];

export type BuildCodeFrameErrorFn = <TError extends Error>(
  msg: string,
  Error?: new (msg: string) => TError
) => TError;

export enum ValueType {
  LAZY,
  FUNCTION,
}

export type ComponentDependency = {
  ex: Identifier;
  source: string;
};

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

export type ExpressionValue = LazyValue | FunctionValue;

export type Replacements = Array<{
  length: number;
  original: {
    end: Location;
    start: Location;
  };
}>;
