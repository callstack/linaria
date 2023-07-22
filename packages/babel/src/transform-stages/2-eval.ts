import { createCustomDebug } from '@linaria/logger';
import type { ValueCache } from '@linaria/tags';
import type { StrictOptions } from '@linaria/utils';
import { getFileIdx } from '@linaria/utils';

import type { TransformCacheCollection } from '../cache';
import evaluate from '../evaluators';
import hasLinariaPreval from '../utils/hasLinariaPreval';

const wrap = <T>(fn: () => T): T | Error => {
  try {
    return fn();
  } catch (e) {
    return e as Error;
  }
};

/**
 * Evaluates template dependencies.
 */
export default function evalStage(
  cache: TransformCacheCollection,
  code: string,
  pluginOptions: StrictOptions,
  filename: string
): [ValueCache, string[]] | null {
  const log = createCustomDebug('transform', getFileIdx(filename));

  log('stage-2', `>> evaluate __linariaPreval`);

  const evaluated = evaluate(cache, code, pluginOptions, filename);

  const linariaPreval = hasLinariaPreval(evaluated.value)
    ? evaluated.value.__linariaPreval
    : undefined;

  if (!linariaPreval) {
    return null;
  }

  const valueCache: ValueCache = new Map();
  Object.entries(linariaPreval).forEach(([key, lazyValue]) => {
    const value = wrap(lazyValue);
    valueCache.set(key, value);
  });

  log('stage-2', `<< evaluated __linariaPreval`, () =>
    JSON.stringify(valueCache)
  );

  return [valueCache, evaluated.dependencies];
}
