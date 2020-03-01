import { types as t, TransformOptions } from '@babel/core';
import { NodePath } from '@babel/traverse';
import { StyledMeta } from '../types';

export type JSONValue = string | number | boolean | JSONObject | JSONArray;

export interface JSONObject {
  [x: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> {}

export type Serializable = JSONArray | JSONObject;

export enum ValueType {
  COMPONENT,
  LAZY,
  FUNCTION,
  VALUE,
}

export type Value = Function | StyledMeta | string | number;

export type ValueCache = Map<t.Expression | string, Value>;

export type ComponentValue = {
  kind: ValueType.COMPONENT;
  ex: NodePath<t.Expression> | t.Expression | string;
};

export type LazyValue = {
  kind: ValueType.LAZY;
  ex: NodePath<t.Expression> | t.Expression | string;
};

export type FunctionValue = {
  kind: ValueType.FUNCTION;
  ex: any;
};

export type EvaluatedValue = {
  kind: ValueType.VALUE;
  value: Value;
};

export type ExpressionValue =
  | ComponentValue
  | LazyValue
  | FunctionValue
  | EvaluatedValue;

export type TemplateExpression = {
  styled?: { component: any };
  path: NodePath<t.TaggedTemplateExpression>;
  expressionValues: ExpressionValue[];
};

export type State = {
  queue: TemplateExpression[];
  rules: {
    [selector: string]: {
      className: string;
      displayName: string;
      cssText: string;
      start: Location | null | undefined;
    };
  };
  replacements: Array<{
    original: {
      start: Location;
      end: Location;
    };
    length: number;
  }>;
  index: number;
  dependencies: string[];
  file: {
    opts: {
      cwd: string;
      root: string;
      filename: string;
    };
    metadata: any;
  };
};

export type Evaluator = (
  filename: string,
  options: StrictOptions,
  text: string,
  only: string[] | null
) => [string, Map<string, string[]> | null];

export type EvalRule = {
  test?: RegExp | ((path: string) => boolean);
  action: Evaluator | 'ignore' | string;
};

type ClassNameFn = (hash: string, title: string) => string;

export type StrictOptions = {
  classNameSlug?: string | ClassNameFn;
  displayName: boolean;
  evaluate: boolean;
  ignore?: RegExp;
  babelOptions: TransformOptions;
  disabled?: boolean;
  rules: EvalRule[];
};

export type Location = {
  line: number;
  column: number;
};

type AllNodes = { [T in t.Node['type']]: Extract<t.Node, { type: T }> };

declare module '@babel/core' {
  namespace types {
    type VisitorKeys = {
      [T in keyof AllNodes]: Extract<
        keyof AllNodes[T],
        {
          [Key in keyof AllNodes[T]]: AllNodes[T][Key] extends
            | t.Node
            | t.Node[]
            | null
            ? Key
            : never;
        }[keyof AllNodes[T]]
      >;
    };

    const VISITOR_KEYS: { [T in keyof VisitorKeys]: VisitorKeys[T][] };
    const ALIAS_KEYS: {
      [T in t.Node['type']]: {
        [K in keyof t.Aliases]: AllNodes[T] extends t.Aliases[K] ? K : never;
      }[keyof t.Aliases][];
    };

    const FLIPPED_ALIAS_KEYS: {
      [T in keyof t.Aliases]: t.Aliases[T]['type'][];
    };

    function shallowEqual(actual: object, expected: object): boolean;
  }
}
