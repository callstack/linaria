import type { TransformOptions } from '@babel/core';

export type ClassNameSlugVars = {
  dir: string;
  ext: string;
  file: string;
  hash: string;
  name: string;
  title: string;
};

export type ClassNameFn = (
  hash: string,
  title: string,
  args: ClassNameSlugVars
) => string;

export type Evaluator = (
  filename: string,
  options: StrictOptions,
  text: string,
  only: string[] | null
) => [string, Map<string, string[]> | null];

export type EvalRule = {
  action: Evaluator | 'ignore' | string;
  babelOptions?: TransformOptions;
  test?: RegExp | ((path: string, code: string) => boolean);
};

export type StrictOptions = {
  babelOptions: TransformOptions;
  classNameSlug?: string | ClassNameFn;
  displayName: boolean;
  evaluate: boolean;
  extensions: string[];
  ignore?: RegExp;
  tagResolver?: (source: string, tag: string) => string | null;
  rules: EvalRule[];
};
