import { isAborted } from '../actions/AbortError';
import type { ITransformResult } from '../actions/types';
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

  let result: ITransformResult | null = null;
  try {
    yield [
      'explodeReexports',
      this.entrypoint,
      undefined,
      abortController.signal,
    ];
    result = yield* this.getNext(
      'transform',
      this.entrypoint,
      undefined,
      abortController.signal
    );
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
    result = yield* this.getNext(
      'processEntrypoint',
      supersededWith,
      undefined,
      null
    );
  }

  log('entrypoint processing finished');

  return result;
}
