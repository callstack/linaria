/**
 * This file is an entry point for module evaluation for getting lazy dependencies.
 */

import type { StrictOptions } from '@linaria/utils';

import type { TransformCacheCollection } from '../cache';
import Module from '../module';

export default function evaluate(
  cache: TransformCacheCollection,
  code: string,
  pluginOptions: StrictOptions,
  filename: string
) {
  const m = new Module(filename ?? 'unknown', pluginOptions, cache);

  m.dependencies = [];
  m.evaluate(code);

  return {
    value: m.exports,
    dependencies: m.dependencies,
    processors: m.tagProcessors,
  };
}
