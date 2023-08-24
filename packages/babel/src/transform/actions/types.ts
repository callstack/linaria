import type { BabelFileResult } from '@babel/core';

import type { Replacements, Rules } from '@linaria/utils';

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
