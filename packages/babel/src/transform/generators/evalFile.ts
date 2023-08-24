import type { ValueCache } from '@linaria/tags';

import evaluate from '../../evaluators';
import hasLinariaPreval from '../../utils/hasLinariaPreval';
import type { IEvalAction, SyncScenarioForAction } from '../types';

const wrap = <T>(fn: () => T): T | Error => {
  try {
    return fn();
  } catch (e) {
    return e as Error;
  }
};

/**
 * Executes the code prepared in previous steps within the current `Entrypoint`.
 * Returns all exports that were requested in `only`.
 */
// eslint-disable-next-line require-yield
export function* evalFile(
  this: IEvalAction<'sync'>
): SyncScenarioForAction<IEvalAction<'sync'>> {
  const { code } = this.data;
  const { entrypoint } = this;
  const { log, name, pluginOptions } = entrypoint;

  log(`>> evaluate __linariaPreval`);

  const evaluated = evaluate(this.services.cache, code, pluginOptions, name);

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

  log(`<< evaluated __linariaPreval %O`, valueCache);

  return [valueCache, evaluated.dependencies];
}
