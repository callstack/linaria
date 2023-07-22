import type { TransformOptions } from '@babel/core';
import type { File } from '@babel/types';

import type { IVariableContext } from '../IVariableContext';
import type { Core } from '../babel';

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

export type VariableNameFn = (context: IVariableContext) => string;

export type EvaluatorConfig = {
  features: StrictOptions['features'];
  highPriorityPlugins: string[];
  onlyExports: string[];
};

export type Evaluator = (
  babelOptions: TransformOptions,
  ast: File,
  code: string,
  config: EvaluatorConfig,
  babel: Core
) => [
  ast: File,
  code: string,
  imports: Map<string, string[]> | null,
  exports?: string[] | null
];

export type EvalRule = {
  action: Evaluator | 'ignore' | string;
  babelOptions?: TransformOptions;
  test?: RegExp | ((path: string, code: string) => boolean);
};

export type FeatureFlag = boolean | string | string[];

export type FeatureFlags = {
  dangerousCodeRemover: FeatureFlag;
};

export type StrictOptions = {
  babelOptions: TransformOptions;
  highPriorityPlugins: string[];
  classNameSlug?: string | ClassNameFn;
  displayName: boolean;
  evaluate: boolean;
  extensions: string[];
  features: FeatureFlags;
  ignore?: RegExp;
  rules: EvalRule[];
  tagResolver?: (source: string, tag: string) => string | null;
  variableNameConfig?: 'var' | 'dashes' | 'raw';
  variableNameSlug?: string | VariableNameFn;
};
