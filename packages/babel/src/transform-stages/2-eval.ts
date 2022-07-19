import { createCustomDebug } from '@linaria/logger';
import type { ValueCache } from '@linaria/tags';
import { getFileIdx } from '@linaria/utils';

import evaluate from '../evaluators';
import type Module from '../module';
import type { CodeCache, Options } from '../types';
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
  resolveCache: Map<string, string>,
  codeCache: CodeCache,
  evalCache: Map<string, Module>,
  code: string[],
  options: Pick<Options, 'filename' | 'pluginOptions'>
): [ValueCache, string[]] | null {
  const log = createCustomDebug('transform', getFileIdx(options.filename));

  log('stage-2', `>> evaluate __linariaPreval`);

  const evaluated = evaluate(resolveCache, codeCache, evalCache, code, options);

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
