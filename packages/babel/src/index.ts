/**
 * File defines babel prest for Linaria.
 * It uses ./extract function that is an entry point for styles extraction.
 * It also bypass babel options defined in Linaria config file with it's defaults (see ./utils/loadOptions).
 */
import type { ConfigAPI, TransformCaller } from '@babel/core';

import { debug } from '@linaria/logger';
import type { PluginOptions } from './utils/loadOptions';
import loadOptions from './utils/loadOptions';

export * as EvalCache from './eval-cache';
export { default as buildOptions } from './evaluators/buildOptions';
export { default as JSXElement } from './evaluators/visitors/JSXElement';
export { default as ProcessCSS } from './evaluators/visitors/ProcessCSS';
export { default as ProcessStyled } from './evaluators/visitors/ProcessStyled';
export { default as Module } from './module';
export {
  default as transform,
  extractCssFromAst,
  shouldTransformCode,
} from './transform';
export * from './types';
export type { PluginOptions } from './utils/loadOptions';
export { default as isNode } from './utils/isNode';
export { default as getVisitorKeys } from './utils/getVisitorKeys';
export { default as peek } from './utils/peek';
export { default as slugify } from './utils/slugify';
export { default as CollectDependencies } from './visitors/CollectDependencies';
export { default as DetectStyledImportName } from './visitors/DetectStyledImportName';
export { default as GenerateClassNames } from './visitors/GenerateClassNames';

function isEnabled(caller?: TransformCaller & { evaluate?: true }) {
  return caller?.name !== 'linaria' || !caller.evaluate;
}

export default function linaria(babel: ConfigAPI, options: PluginOptions) {
  if (!babel.caller(isEnabled)) {
    return {};
  }
  debug('options', JSON.stringify(options));
  return {
    plugins: [[require('./extract'), loadOptions(options)]],
  };
}
