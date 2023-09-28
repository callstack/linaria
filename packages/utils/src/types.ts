import type {
  BigIntLiteral,
  BooleanLiteral,
  DecimalLiteral,
  Identifier,
  NullLiteral,
  NumericLiteral,
  StringLiteral,
} from '@babel/types';

export type Artifact = [name: string, data: unknown];

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

export type BuildCodeFrameErrorFn = <TError extends Error>(
  msg: string,
  Error?: new (innerMsg: string) => TError
) => TError;

export enum ValueType {
  LAZY,
  FUNCTION,
  CONST,
}

export type LazyValue = {
  buildCodeFrameError: BuildCodeFrameErrorFn;
  ex: Identifier;
  importedFrom?: string[];
  kind: ValueType.LAZY;
  source: string;
};

export type FunctionValue = {
  buildCodeFrameError: BuildCodeFrameErrorFn;
  ex: Identifier;
  importedFrom?: string[];
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

export type StyledMeta = {
  __linaria: {
    className: string;
    extends: StyledMeta;
  };
};

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

export type Rules = Record<string, ICSSRule>;

export type LinariaMetadata = {
  dependencies: string[];
  processors: { artifacts: Artifact[] }[];
  replacements: Replacement[];
  rules: Rules;
};

export type Replacement = {
  length: number;
  original: { end: Location; start: Location };
};

export type Replacements = Array<Replacement>;

export interface IEvaluatorMetadata {
  imports: Map<string, string[]>;
}

export interface IMetadata {
  linariaEvaluator: IEvaluatorMetadata;
}
