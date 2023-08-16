import type { IBaseEntrypoint } from '../../../types';
import type { IProcessEntrypointAction, Next } from '../types';

import { getRefsCount } from './action';

/**
 * The first stage of processing an entrypoint.
 * This stage is responsible for:
 * - scheduling the explodeReexports action
 * - scheduling the transform action
 */
export function processEntrypoint<TEntrypoint extends IBaseEntrypoint>(
  _services: unknown,
  action: IProcessEntrypointAction<TEntrypoint>,
  next: Next
): void {
  const { name, only, log } = action.entrypoint;
  log(
    'start processing %s (only: %s, refs: %d)',
    name,
    only,
    getRefsCount(action.entrypoint)
  );

  next('explodeReexports', action.entrypoint, {});
  next('transform', action.entrypoint, {});
}
