import type { IBaseEntrypoint } from '../../../types';
import { onSupersede } from '../createEntrypoint';
import type { IProcessEntrypointAction } from '../types';

import { getRefsCount } from './action';

/**
 * The first stage of processing an entrypoint.
 * This stage is responsible for:
 * - scheduling the explodeReexports action
 * - scheduling the transform action
 * - rescheduling itself if the entrypoint is superseded
 */
export function processEntrypoint<TEntrypoint extends IBaseEntrypoint>(
  _services: unknown,
  action: IProcessEntrypointAction<TEntrypoint>
): void {
  const { name, only, log } = action.entrypoint;
  log(
    'start processing %s (only: %s, refs: %d)',
    name,
    only,
    getRefsCount(action.entrypoint)
  );

  const abortController = new AbortController();

  const onParentAbort = () => {
    abortController.abort();
  };

  if (action.abortSignal) {
    action.abortSignal.addEventListener('abort', onParentAbort);
  }

  const unsubscribe = onSupersede(action.entrypoint, (newEntrypoint) => {
    log(
      'superseded by %s (only: %s, refs: %d)',
      newEntrypoint.name,
      newEntrypoint.only,
      getRefsCount(newEntrypoint)
    );
    abortController.abort();
    action.next('processEntrypoint', newEntrypoint, {}, null);
  });

  const onDone = () => {
    log('done processing %s', name);
    unsubscribe();
    action.abortSignal?.removeEventListener('abort', onParentAbort);
  };

  action.next(
    'explodeReexports',
    action.entrypoint,
    {},
    abortController.signal
  );
  action
    .next('transform', action.entrypoint, {}, abortController.signal)
    .on('done', onDone);
}
