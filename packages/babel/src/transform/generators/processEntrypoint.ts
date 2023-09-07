import { isAborted } from '../actions/AbortError';
import type {
  IProcessEntrypointAction,
  SyncScenarioForAction,
  YieldArg,
} from '../types';

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

  this.entrypoint.abortIfSuperseded();

  using abortSignal = this.createAbortSignal();

  yield ['explodeReexports', this.entrypoint, undefined, abortSignal];
  const result = yield* this.getNext(
    'transform',
    this.entrypoint,
    undefined,
    abortSignal
  );

  this.entrypoint.setTransformResult(result);

  this.entrypoint.abortIfSuperseded();

  log('entrypoint processing finished');
}

processEntrypoint.recover = (
  e: unknown,
  action: IProcessEntrypointAction
): YieldArg => {
  if (isAborted(e) && action.entrypoint.supersededWith) {
    action.entrypoint.log('aborting processing');
    return [
      'processEntrypoint',
      action.entrypoint.supersededWith,
      undefined,
      null,
    ];
  }

  action.entrypoint.log(`Unhandled error: %O`, e);
  throw e;
};
