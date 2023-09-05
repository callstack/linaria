import type { BabelFileResult } from '@babel/core';

import type { Replacements, Rules } from '@linaria/utils';

export interface IExtracted {
  cssSourceMapText: string;
  cssText: string;
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
