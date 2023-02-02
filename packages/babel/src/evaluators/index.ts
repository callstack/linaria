/**
 * This file is an entry point for module evaluation for getting lazy dependencies.
 */

import type { TransformCacheCollection } from '../cache';
import Module from '../module';
import loadLinariaOptions from '../transform-stages/helpers/loadLinariaOptions';
import type { Options } from '../types';

export default function evaluate(
  cache: TransformCacheCollection,
  code: string,
  options: Pick<Options, 'filename' | 'pluginOptions'>
) {
  const filename = options?.filename ?? 'unknown';
  const pluginOptions = loadLinariaOptions(options.pluginOptions);

  const m = new Module(filename ?? 'unknown', pluginOptions, cache);

  m.dependencies = [];
  m.evaluate(code);

  return {
    value: m.exports,
    dependencies: m.dependencies,
    processors: m.tagProcessors,
  };
}
