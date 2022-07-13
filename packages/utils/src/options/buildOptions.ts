import type { TransformOptions } from '@babel/core';
import babelMerge from 'babel-merge';

import isNotNull from '../isNotNull';

const cache = new WeakMap<
  TransformOptions,
  WeakMap<TransformOptions, TransformOptions>
>();

const merge = (a: TransformOptions, b: TransformOptions) => {
  if (!cache.has(a)) {
    cache.set(a, new WeakMap());
  }

  const cacheForA = cache.get(a)!;
  if (cacheForA.has(b)) {
    return cacheForA.get(b)!;
  }

  const result = babelMerge(a, b);
  cacheForA.set(b, result);
  return result;
};

/**
 * Merges babel configs together. If a pair of configs were merged before,
 * it will return the cached result.
 */
export default function buildOptions(
  ...configs: (TransformOptions | null | undefined)[]
): TransformOptions {
  // Merge all configs together
  return configs
    .map((i) => i ?? null)
    .filter(isNotNull)
    .reduce(merge);
}
