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

  const unsubscribed = onSupersede(action.entrypoint, (newEntrypoint) => {
    action.next('processEntrypoint', newEntrypoint, {});
  });

  action.next('explodeReexports', action.entrypoint, {});
  action.next('transform', action.entrypoint, {}).on('done', unsubscribed);
}
