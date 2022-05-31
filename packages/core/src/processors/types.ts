import type { NodePath } from '@babel/traverse';
import type { Expression } from '@babel/types';

import type { StyledMeta } from '../StyledMeta';

export type JSONValue = string | number | boolean | JSONObject | JSONArray;

export interface JSONObject {
  [x: string]: JSONValue;
}

export type JSONArray = Array<JSONValue>;

export type Serializable = JSONArray | JSONObject;

export type Value = (() => void) | StyledMeta | string | number | Serializable;

export type ValueCache = Map<Expression, Value>;

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

export type WrappedNode = string | { node: Expression; source: string };

export type Rules = Record<string, ICSSRule>;

export type CallParam = ['call', ...[string, NodePath<Expression>][]];
export type MemberParam = ['member', NodePath<Expression>];

export type Params = (CallParam | MemberParam)[];

export interface IDependency {
  ex: NodePath<Expression>;
  source: string;
}
