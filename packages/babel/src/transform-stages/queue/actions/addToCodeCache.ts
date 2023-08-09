import type { IAddToCodeCacheAction, Services } from '../types';

export function addToCodeCache(
  { cache }: Services,
  action: IAddToCodeCacheAction,
  callbacks: {
    done: () => void;
  }
) {
  cache.add('code', action.entrypoint.name, action.data);
  callbacks.done();
}
