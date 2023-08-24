import type { IAddToCodeCacheAction, SyncScenarioForAction } from '../types';

// eslint-disable-next-line require-yield
export function* addToCodeCache(
  this: IAddToCodeCacheAction<'sync'>
): SyncScenarioForAction<IAddToCodeCacheAction<'sync'>> {
  this.services.cache.add('code', this.entrypoint.name, this.data);
}
