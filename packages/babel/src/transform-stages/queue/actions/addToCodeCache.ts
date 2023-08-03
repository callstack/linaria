import type { IAddToCodeCacheAction, Services } from '../types';

export function addToCodeCache(
  { cache }: Services,
  action: IAddToCodeCacheAction
) {
  cache.add('code', action.entrypoint.name, action.data);
}
