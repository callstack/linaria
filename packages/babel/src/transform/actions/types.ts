import type { BabelFileResult } from '@babel/core';

import type { Replacements, Rules } from '@linaria/utils';

import type { ITransformFileResult } from '../../types';

export interface ITransformResult {
  imports: Map<string, string[]> | null;
  only: string[];
  result: ITransformFileResult;
}

export interface IResolvedImport {
  importedFile: string;
  importsOnly: string[];
  resolved: string;
}

export interface IExtracted {
  cssText: string;
  cssSourceMapText: string;
  replacements: Replacements;
  rules: Rules;
}

export interface IWorkflowActionNonLinariaResult {
  code: string;
  sourceMap: BabelFileResult['map'];
}

export interface IWorkflowActionLinariaResult
  extends IExtracted,
    IWorkflowActionNonLinariaResult {
  dependencies: string[];
}
