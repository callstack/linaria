/**
 * File defines babel preset for Linaria.
 * It uses ./extract function that is an entry point for styles extraction.
 * It also bypass babel options defined in Linaria config file with it's defaults (see ./utils/loadOptions).
 */
import type { ConfigAPI, TransformCaller } from '@babel/core';

import { debug } from '@linaria/logger';

import transform from './plugins/babel-transform';
import type { PluginOptions } from './transform-stages/helpers/loadLinariaOptions';

export { slugify } from '@linaria/utils';

export { default as preeval } from './plugins/preeval';
export { default as withLinariaMetadata } from './utils/withLinariaMetadata';
export { default as Module, DefaultModuleImplementation } from './module';
export { default as transform } from './transform';
export * from './types';
export { parseFile } from './transform-stages/helpers/parseFile';
export { default as loadLinariaOptions } from './transform-stages/helpers/loadLinariaOptions';
export type { PluginOptions } from './transform-stages/helpers/loadLinariaOptions';
export {
  createEntrypoint,
  prepareCode,
} from './transform-stages/1-prepare-for-eval';
export { transformUrl } from './transform-stages/4-extract';
export { default as isNode } from './utils/isNode';
export { default as getTagProcessor } from './utils/getTagProcessor';
export { default as getVisitorKeys } from './utils/getVisitorKeys';
export type { VisitorKeys } from './utils/getVisitorKeys';
export { default as peek } from './utils/peek';
export { processTemplateExpression } from './utils/processTemplateExpression';
export { TransformCacheCollection } from './cache';

function isEnabled(caller?: TransformCaller & { evaluate?: true }) {
  return caller?.name !== 'linaria' || caller.evaluate === true;
}

export default function linaria(babel: ConfigAPI, options: PluginOptions) {
  if (!babel.caller(isEnabled)) {
    return {};
  }
  debug('options', JSON.stringify(options));
  return {
    plugins: [[transform, options]],
  };
}
