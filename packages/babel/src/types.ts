import type { Expression, TaggedTemplateExpression } from '@babel/types';
import type { TransformOptions } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import type { StyledMeta } from '@linaria/core';
import type { RawSourceMap } from 'source-map';
import type { PluginOptions } from './utils/loadOptions';

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
    atom?: boolean;
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

export type ClassNameSlugVars = {
  hash: string;
  title: string;
  file: string;
  ext: string;
  name: string;
  dir: string;
};

type ClassNameFn = (
  hash: string,
  title: string,
  args: ClassNameSlugVars
) => string;

type AtomizeFn = (cssText: string) => {
  className: string;
  cssText: string;
  property: string;
}[];

export type LibResolverFn = (linariaLibPath: string) => string | null;

export type StrictOptions = {
  classNameSlug?: string | ClassNameFn;
  displayName: boolean;
  evaluate: boolean;
  ignore?: RegExp;
  atomize?: AtomizeFn;
  babelOptions: TransformOptions;
  rules: EvalRule[];
  libResolver?: LibResolverFn;
};

export type Location = {
  line: number;
  column: number;
};

export type Replacement = {
  original: { start: Location; end: Location };
  length: number;
};

export type Result = {
  code: string;
  sourceMap?: RawSourceMap | null;
  cssText?: string;
  cssSourceMapText?: string;
  dependencies?: string[];
  rules?: Rules;
  replacements?: Replacement[];
};

export type LinariaMetadata = {
  rules: Rules;
  replacements: Replacement[];
  dependencies: string[];
};

export type Options = {
  filename: string;
  preprocessor?: Preprocessor;
  outputFilename?: string;
  inputSourceMap?: RawSourceMap;
  pluginOptions?: Partial<PluginOptions>;
};

export type PreprocessorFn = (selector: string, cssText: string) => string;
export type Preprocessor = 'none' | 'stylis' | PreprocessorFn | void;
