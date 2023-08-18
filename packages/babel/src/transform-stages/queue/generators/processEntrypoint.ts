import type { IBaseEntrypoint } from '../../../types';
import { getRefsCount } from '../actions/action';
import { onSupersede } from '../createEntrypoint';
import type { IProcessEntrypointAction, ActionGenerator } from '../types';

/**
 * The first stage of processing an entrypoint.
 * This stage is responsible for:
 * - scheduling the explodeReexports action
 * - scheduling the transform action
 * - rescheduling itself if the entrypoint is superseded
 */
export function* processEntrypoint<TEntrypoint extends IBaseEntrypoint>(
  _services: unknown,
  action: IProcessEntrypointAction<TEntrypoint>
): ActionGenerator<IProcessEntrypointAction> {
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

  let supersededWith: IBaseEntrypoint | null = null;
  onSupersede(action.entrypoint, (newEntrypoint) => {
    supersededWith = newEntrypoint;
    abortController.abort();
  });

  yield ['explodeReexports', action.entrypoint, {}, abortController.signal];
  yield ['transform', action.entrypoint, {}, abortController.signal];

  action.abortSignal?.removeEventListener('abort', onParentAbort);

  if (supersededWith) {
    yield ['processEntrypoint', supersededWith, {}, null];
  }
}
