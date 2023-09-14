/**
 * This file is an entry point for module evaluation for getting lazy dependencies.
 */

import type { TransformCacheCollection } from '../cache';
import Module from '../module';
import type { Entrypoint } from '../transform/Entrypoint';

export interface IEvaluateResult {
  dependencies: string[];
  value: Record<string | symbol, unknown>;
}

export default function evaluate(
  cache: TransformCacheCollection,
  entrypoint: Entrypoint
): IEvaluateResult {
  using m = new Module(entrypoint, cache);

  m.evaluate();

  return {
    value: entrypoint.exports,
    dependencies: m.dependencies,
  };
}
