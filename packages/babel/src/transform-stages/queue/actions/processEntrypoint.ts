import type { Next } from '../ActionQueue';
import type {
  IEntrypoint,
  IProcessEntrypointAction,
  Services,
  ActionQueueItem,
} from '../types';

const includes = (a: string[], b: string[]) => {
  if (a.includes('*')) return true;
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
};

const abortControllers = new WeakMap<IEntrypoint, AbortController>();

/**
 * The first stage of processing an entrypoint.
 * It checks if the file is already processed and if it is, it checks if the `only` option is the same.
 * If it is not, it emits a transformation action for the file with the merged `only` option.
 */
export function processEntrypoint(
  { cache }: Services,
  action: IProcessEntrypointAction,
  next: Next<IEntrypoint, ActionQueueItem>
): void {
  const { name, only, log } = action.entrypoint;
  log(
    'start processing %s (only: %s, refs: %d)',
    name,
    only,
    action.refCount ?? 0
  );

  const cached = cache.get('entrypoints', name);
  // If we already have a result for this file, we should get a result for merged `only`
  const mergedOnly = cached?.only
    ? Array.from(new Set([...cached.only, ...only])).sort()
    : only;

  if (cached) {
    if (includes(cached.only, mergedOnly)) {
      log('%s is already processed', name);
      return;
    }

    log(
      '%s is already processed, but with different `only` %o (the cached one %o)',
      name,
      only,
      cached?.only
    );

    // If we already have a result for this file, we should invalidate it
    cache.invalidate('eval', name);
    abortControllers.get(cached)?.abort();
  }

  const abortController = new AbortController();
  const entrypoint: IEntrypoint = {
    ...action.entrypoint,
    only: mergedOnly,
    abortSignal: abortController.signal,
  };

  abortControllers.set(entrypoint, abortController);

  cache.add('entrypoints', name, entrypoint);

  next({
    type: 'transform',
    entrypoint,
    stack: action.stack,
  });
}
