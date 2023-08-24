import { isAborted } from '../actions/AbortError';
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
  const { only, log } = this.entrypoint;
  log('start processing (only: %s)', only);

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

  try {
    yield [
      'explodeReexports',
      this.entrypoint,
      undefined,
      abortController.signal,
    ];
    yield ['transform', this.entrypoint, undefined, abortController.signal];
  } catch (e) {
    if (isAborted(e)) {
      log('aborting processing');
    } else {
      throw e;
    }
  }

  this.abortSignal?.removeEventListener('abort', onParentAbort);
  unsubscribe();

  const { supersededWith } = this.entrypoint;
  if (supersededWith) {
    log('entrypoint superseded, rescheduling processing');
    yield ['processEntrypoint', supersededWith, undefined, null];
  } else {
    log('entrypoint processing finished');
  }
}
