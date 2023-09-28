import type { ValueCache } from '@linaria/tags';

import type { IEvaluateResult } from '../../evaluators';
import evaluate from '../../evaluators';
import hasLinariaPreval from '../../utils/hasLinariaPreval';
import { isUnprocessedEntrypointError } from '../actions/UnprocessedEntrypointError';
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
  this: IEvalAction
): SyncScenarioForAction<IEvalAction> {
  const { entrypoint } = this;
  const { log } = entrypoint;

  log(`>> evaluate __linariaPreval`);

  let evaluated: IEvaluateResult | undefined;

  while (evaluated === undefined) {
    try {
      evaluated = evaluate(this.services, entrypoint);
    } catch (e) {
      if (isUnprocessedEntrypointError(e)) {
        entrypoint.log(
          'Evaluation has been aborted because one if the required files is not processed. Schedule reprocessing and repeat evaluation.'
        );
        yield ['processEntrypoint', e.entrypoint, undefined];
      } else {
        throw e;
      }
    }
  }

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
