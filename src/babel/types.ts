import type {
  Aliases,
  Node,
  Expression,
  TaggedTemplateExpression,
} from '@babel/types';
import type { TransformOptions } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import type { VisitorKeys } from '@babel/types';
import type { StyledMeta } from '../StyledMeta';

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

export type ValueCache = Map<Expression | string, Value>;

export type ComponentValue = {
  kind: ValueType.COMPONENT;
  ex: NodePath<Expression> | Expression | string;
};

export type LazyValue = {
  kind: ValueType.LAZY;
  ex: NodePath<Expression> | Expression | string;
  originalEx: NodePath<Expression> | Expression | string;
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
  path: NodePath<TaggedTemplateExpression>;
  expressionValues: ExpressionValue[];
};

type Rules = {
  [selector: string]: {
    className: string;
    displayName: string;
    cssText: string;
    start: Location | null | undefined;
  };
};

type Replacements = Array<{
  original: {
    start: Location;
    end: Location;
  };
  length: number;
}>;

type Dependencies = string[];

export type State = {
  queue: TemplateExpression[];
  rules: Rules;
  replacements: Replacements;
  index: number;
  dependencies: Dependencies;
  file: {
    opts: {
      cwd: string;
      root: string;
      filename: string;
    };
    metadata: {
      localName?: string;
      linaria?: {
        rules: Rules;
        replacements: Replacements;
        dependencies: Dependencies;
      };
    };
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
  rules: EvalRule[];
};

export type Location = {
  line: number;
  column: number;
};

type AllNodes = { [T in Node['type']]: Extract<Node, { type: T }> };

declare module '@babel/types' {
  type VisitorKeys = {
    [T in keyof AllNodes]: Extract<
      keyof AllNodes[T],
      {
        [Key in keyof AllNodes[T]]: AllNodes[T][Key] extends
          | Node
          | Node[]
          | null
          ? Key
          : never;
      }[keyof AllNodes[T]]
    >;
  };
}

declare module '@babel/core' {
  namespace types {
    const VISITOR_KEYS: { [T in keyof VisitorKeys]: VisitorKeys[T][] };
    const ALIAS_KEYS: {
      [T in Node['type']]: {
        [K in keyof Aliases]: AllNodes[T] extends Aliases[K] ? K : never;
      }[keyof Aliases][];
    };

    const FLIPPED_ALIAS_KEYS: {
      [T in keyof Aliases]: Aliases[T]['type'][];
    };

    function shallowEqual(actual: object, expected: object): boolean;
  }
}
