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
  line: number;
  column: number;
};

export interface ICSSRule {
  className: string;
  displayName: string;
  cssText: string;
  start: Location | null | undefined;
  atom?: boolean;
}

export type Rules = Record<string, ICSSRule>;

export type LinariaMetadata = {
  processors: { artifacts: Artifact[] }[];

  rules: Rules;
  replacements: Replacement[];
  dependencies: string[];
};

export type Replacement = {
  original: { start: Location; end: Location };
  length: number;
};

export type Replacements = Array<Replacement>;

export interface IEvaluatorMetadata {
  imports: Map<string, string[]>;
}

export interface IMetadata {
  linariaEvaluator: IEvaluatorMetadata;
}
