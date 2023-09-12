/**
 * File defines babel preset for Linaria.
 * It uses ./extract function that is an entry point for styles extraction.
 * It also bypass babel options defined in Linaria config file with it's defaults (see ./utils/loadOptions).
 */
import type { ConfigAPI, TransformCaller } from '@babel/core';

import { debug } from '@linaria/logger';

import transform from './plugins/babel-transform';
import type { PluginOptions } from './types';

export { slugify } from '@linaria/utils';

export { default as preeval } from './plugins/preeval';
export {
  default as withLinariaMetadata,
  getLinariaMetadata,
} from './utils/withLinariaMetadata';
export { default as Module, DefaultModuleImplementation } from './module';
export { default as transform } from './transform';
export {
  isUnprocessedEntrypointError,
  UnprocessedEntrypointError,
} from './transform/actions/UnprocessedEntrypointError';
export * from './types';
export { EvaluatedEntrypoint } from './transform/EvaluatedEntrypoint';
export type { IEvaluatedEntrypoint } from './transform/EvaluatedEntrypoint';
export { parseFile } from './transform/Entrypoint.helpers';
export type { LoadAndParseFn } from './transform/Entrypoint.types';
export { baseHandlers } from './transform/generators';
export { prepareCode } from './transform/generators/transform';
export { Entrypoint } from './transform/Entrypoint';
export { transformUrl } from './transform/generators/extract';
export {
  asyncResolveImports,
  syncResolveImports,
} from './transform/generators/resolveImports';
export { default as loadLinariaOptions } from './transform/helpers/loadLinariaOptions';
export { withDefaultServices } from './transform/helpers/withDefaultServices';
export type { Services } from './transform/types';
export { default as isNode } from './utils/isNode';
export { getTagProcessor } from './utils/getTagProcessor';
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
