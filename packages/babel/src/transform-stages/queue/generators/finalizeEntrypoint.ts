import type {
  IAddToCodeCacheAction,
  IFinalizeEntrypointAction,
  SyncScenarioForAction,
} from '../types';

// eslint-disable-next-line require-yield
export function* finalizeEntrypoint(
  this: IFinalizeEntrypointAction<'sync'>
): SyncScenarioForAction<IAddToCodeCacheAction<'sync'>> {
  this.data.finalizer();
}
