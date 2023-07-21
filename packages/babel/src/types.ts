import type { BabelFile, PluginPass } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import type { File } from '@babel/types';
import type { RawSourceMap } from 'source-map';

import type { IMetadata, Replacement, Rules } from '@linaria/utils';

import type { PluginOptions } from './transform-stages/helpers/loadLinariaOptions';

export type { Value, ValueCache } from '@linaria/tags';

export type {
  ExpressionValue,
  FunctionValue,
  JSONArray,
  JSONObject,
  JSONValue,
  LazyValue,
  Serializable,
} from '@linaria/utils';

export { ValueType } from '@linaria/utils';

export type Dependencies = string[];

export interface IPluginState extends PluginPass {
  dependencies: Dependencies;
  file: BabelFile & {
    metadata: IMetadata;
  };
}

export interface ITransformFileResult {
  metadata?: IMetadata;
  ast: File;
  code: string;
}

export type Stage = 'preeval' | 'collect';

export type Result = {
  code: string;
  sourceMap?: RawSourceMap | null;
  cssText?: string;
  cssSourceMapText?: string;
  dependencies?: string[];
  rules?: Rules;
  replacements?: Replacement[];
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
