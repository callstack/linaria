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

  if (this.entrypoint.supersededWith) {
    log('entrypoint already superseded, rescheduling processing');
    yield [
      'processEntrypoint',
      this.entrypoint.supersededWith,
      undefined,
      null,
    ];
    return;
  }

  const abortController = new AbortController();

  const onParentAbort = () => {
    log('parent aborted, aborting processing');
    abortController.abort();
  };

  if (this.abortSignal) {
    this.abortSignal.addEventListener('abort', onParentAbort);
  }

  const unsubscribe = this.entrypoint.onSupersede(() => {
    log('entrypoint superseded, aborting processing');
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
    if (isAborted(e) && this.entrypoint.supersededWith) {
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
