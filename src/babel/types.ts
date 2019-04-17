import { ElementType } from 'react';
import { types as t, TransformOptions } from '@babel/core';
import { NodePath } from '@babel/traverse';

export type JSONValue = string | number | boolean | JSONObject | JSONArray;

export interface JSONObject {
  [x: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> {}

export type Serializable = JSONArray | JSONObject;

export type Styled = ElementType & {
  __linaria: {
    className: string;
    extends: ElementType | Styled;
  };
};

export enum ValueType {
  LAZY,
  FUNCTION,
  VALUE,
}

export type Value = Function | Styled | string | number;

export type ValueCache = Map<t.Expression | string, Value>;

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

export type ExpressionValue = LazyValue | FunctionValue | EvaluatedValue;

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

export type StrictOptions = {
  classNameSlug: string;
  displayName: boolean;
  evaluate: boolean;
  ignore: RegExp;
  babelOptions: TransformOptions;
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
          [Key in keyof AllNodes[T]]: AllNodes[T][Key] extends (
            | t.Node
            | t.Node[]
            | null)
            ? Key
            : never
        }[keyof AllNodes[T]]
      >
    };

    const VISITOR_KEYS: { [T in keyof VisitorKeys]: VisitorKeys[T][] };
    const FLIPPED_ALIAS_KEYS: {
      [T in keyof t.Aliases]: t.Aliases[T]['type'][]
    };

    function shallowEqual(actual: object, expected: object): boolean;
  }
}
