import type { TransformOptions } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import type { File } from '@babel/types';
import type { RawSourceMap } from 'source-map';

import type BaseProcessor from '@linaria/core/processors/BaseProcessor';
import type { Replacements } from '@linaria/core/processors/types';
import type { ClassNameFn } from '@linaria/core/processors/utils/types';

import type { PluginOptions } from './utils/loadOptions';

export type {
  ComponentDependency,
  ExpressionValue,
  FunctionValue,
  JSONArray,
  JSONObject,
  JSONValue,
  LazyValue,
  Serializable,
  Value,
  ValueCache,
} from '@linaria/core/processors/types';

export { ValueType } from '@linaria/core/processors/types';

export interface ICSSRule {
  className: string;
  displayName: string;
  cssText: string;
  start: Location | null | undefined;
  atom?: boolean;
}

export type Rules = Record<string, ICSSRule>;

export type Dependencies = string[];

export type State = {
  processors: BaseProcessor[];
  dependencies: Dependencies;
  file: {
    opts: {
      cwd: string;
      root: string;
      filename: string;
    };
    metadata: {
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

export type LibResolverFn = (linariaLibPath: string) => string | null;

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
  inputSourceMap?: RawSourceMap;
  outputFilename?: string;
  pluginOptions?: Partial<PluginOptions>;
  preprocessor?: Preprocessor;
  root?: string;
};

export type PreprocessorFn = (selector: string, cssText: string) => string;
export type Preprocessor = 'none' | 'stylis' | PreprocessorFn | void;

export type MissedBabelCoreTypes = {
  File: new (
    options: { filename: string },
    file: { code: string; ast: File }
  ) => { path: NodePath<File> };
};
