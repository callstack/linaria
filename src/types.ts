import { PluginOptions } from './babel/utils/loadOptions';

export type Replacement = {
  original: { start: Location; end: Location };
  length: number;
};

export type Location = {
  line: number;
  column: number;
};

export type Rules = {
  [className: string]: {
    cssText: string;
    displayName: string;
    start: Location | null;
  };
};

export type Result = {
  code: string;
  sourceMap: Object | null | undefined;
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
  inputSourceMap?: Object;
  pluginOptions?: Partial<PluginOptions>;
};

export type StyledMeta = {
  __linaria: {
    className: string;
    extends: StyledMeta;
  };
};

export type PreprocessorFn = (selector: string, cssText: string) => string;
export type Preprocessor = 'none' | 'stylis' | PreprocessorFn | void;
