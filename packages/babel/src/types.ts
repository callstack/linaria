import type { BabelFile, BabelFileMetadata, PluginPass } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import type { File } from '@babel/types';
import type { RawSourceMap } from 'source-map';

import type { CustomDebug, Debugger } from '@linaria/logger';
import type { BaseProcessor } from '@linaria/tags';
import type {
  LinariaMetadata,
  Replacement,
  Rules,
  StrictOptions,
} from '@linaria/utils';

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

export type PluginOptions = StrictOptions & {
  configFile?: string | false;
  stage?: Stage;
};

export interface IModule {
  debug: CustomDebug;
  readonly exports: unknown;
  readonly idx: number;
  readonly isEvaluated: boolean;
  readonly only: string;
}

export interface IBaseEntrypoint {
  idx: string;
  log: Debugger;
  name: string;
  only: string[];
  parent: IBaseEntrypoint | null;
}

export type Dependencies = string[];

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
