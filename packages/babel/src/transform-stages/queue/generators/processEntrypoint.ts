import type { IBaseEntrypoint } from '../../../types';
import { getRefsCount } from '../actions/action';
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

  const unsubscribe = action.entrypoint.onSupersede(() => {
    abortController.abort();
  });

  yield ['explodeReexports', action.entrypoint, {}, abortController.signal];
  yield ['transform', action.entrypoint, {}, abortController.signal];

  // Do not pass the abort signal to the finalize action because it should always run
  yield [
    'finalizeEntrypoint',
    action.entrypoint,
    {
      finalizer: () => {
        action.abortSignal?.removeEventListener('abort', onParentAbort);
        unsubscribe();
      },
    },
    null,
  ];
}
