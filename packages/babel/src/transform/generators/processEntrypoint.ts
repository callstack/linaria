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
  this: IProcessEntrypointAction
): SyncScenarioForAction<IProcessEntrypointAction> {
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
    const result = yield* this.getNext(
      'transform',
      this.entrypoint,
      undefined,
      abortController.signal
    );
    this.entrypoint.setTransformResult(result);
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
  }

  log('entrypoint processing finished');
}
