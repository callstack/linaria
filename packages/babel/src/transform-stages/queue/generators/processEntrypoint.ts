import type { IProcessEntrypointAction, SyncScenarioForAction } from '../types';

/**
 * The first stage of processing an entrypoint.
 * This stage is responsible for:
 * - scheduling the explodeReexports action
 * - scheduling the transform action
 * - rescheduling itself if the entrypoint is superseded
 */
export function* processEntrypoint(
  this: IProcessEntrypointAction<'sync'>
): SyncScenarioForAction<IProcessEntrypointAction<'sync'>> {
  const { name, only, log } = this.entrypoint;
  log('start processing %s (only: %s)', name, only);

  const abortController = new AbortController();

  const onParentAbort = () => {
    abortController.abort();
  };

  if (this.abortSignal) {
    this.abortSignal.addEventListener('abort', onParentAbort);
  }

  const unsubscribe = this.entrypoint.onSupersede(() => {
    abortController.abort();
  });

  yield [
    'explodeReexports',
    this.entrypoint,
    undefined,
    abortController.signal,
  ];
  yield ['transform', this.entrypoint, undefined, abortController.signal];

  // Do not pass the abort signal to the finalize action because it should always run
  yield [
    'finalizeEntrypoint',
    this.entrypoint,
    {
      finalizer: () => {
        this.abortSignal?.removeEventListener('abort', onParentAbort);
        unsubscribe();
      },
    },
    null,
  ];
}
