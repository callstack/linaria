import type { BabelFile, BabelFileMetadata, PluginPass } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import type { File } from '@babel/types';
import type { RawSourceMap } from 'source-map';

import type { BaseProcessor } from '@linaria/tags';

import type { PluginOptions } from './transform-stages/helpers/loadLinariaOptions';

export type {
  ExpressionValue,
  FunctionValue,
  JSONArray,
  JSONObject,
  JSONValue,
  LazyValue,
  Serializable,
  Value,
  ValueCache,
} from '@linaria/tags';

export { ValueType } from '@linaria/tags';

export interface ICSSRule {
  className: string;
  displayName: string;
  cssText: string;
  start: Location | null | undefined;
  atom?: boolean;
}

export type Rules = Record<string, ICSSRule>;

export type Dependencies = string[];

export type LinariaMetadata = {
  processors: BaseProcessor[];

  rules: Rules;
  replacements: Replacement[];
  dependencies: string[];
};

export interface IPluginState extends PluginPass {
  processors: BaseProcessor[];
  dependencies: Dependencies;
  file: BabelFile & {
    metadata: {
      linaria?: LinariaMetadata;
    };
  };
}

export interface ITransformFileResult {
  metadata?: BabelFileMetadata;
  code: string;
}

export type CodeCache = Map<string, Map<string, ITransformFileResult>>;

export type Stage = 'preeval' | 'collect';

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
