/**
 * This file is an entry point for module evaluation for getting lazy dependencies.
 */

import type { TransformCacheCollection } from '../cache';
import Module from '../module';
import type { Entrypoint } from '../transform/Entrypoint';

export default function evaluate(
  cache: TransformCacheCollection,
  entrypoint: Entrypoint
) {
  using m = new Module(entrypoint, cache);

  m.evaluate();

  return {
    value: entrypoint.exports,
    dependencies: m.dependencies,
  };
}
