import type { ValueCache } from '@linaria/tags';

import evaluate from '../../../evaluators';
import hasLinariaPreval from '../../../utils/hasLinariaPreval';
import type { Services, ActionGenerator, IEvalAction } from '../types';

const wrap = <T>(fn: () => T): T | Error => {
  try {
    return fn();
  } catch (e) {
    return e as Error;
  }
};

// eslint-disable-next-line require-yield
export function* evalFile(
  services: Services,
  action: IEvalAction
): ActionGenerator<IEvalAction> {
  const { code, entrypoint } = action;
  const { log, name, pluginOptions } = entrypoint;

  log(`>> evaluate __linariaPreval`);

  const evaluated = evaluate(services.cache, code, pluginOptions, name);

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
