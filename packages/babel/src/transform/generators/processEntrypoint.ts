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
  log('start processing (only: %o)', only);

  try {
    using abortSignal = this.createAbortSignal();

    yield ['explodeReexports', this.entrypoint, undefined, abortSignal];
    const result = yield* this.getNext(
      'transform',
      this.entrypoint,
      undefined,
      abortSignal
    );

    this.entrypoint.assertNotSuperseded();

    this.entrypoint.setTransformResult(result);

    log('entrypoint processing finished');
  } catch (e) {
    if (isAborted(e) && this.entrypoint.supersededWith) {
      log('processing aborted, schedule the next attempt');
      yield* this.getNext(
        'processEntrypoint',
        this.entrypoint.supersededWith,
        undefined,
        null
      );

      return;
    }

    log(`Unhandled error: %O`, e);
    throw e;
  }
}
