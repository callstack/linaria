import type { IAddToCodeCacheAction, Next, Services } from '../types';

export function addToCodeCache(
  { cache }: Services,
  action: IAddToCodeCacheAction,
  next: Next,
  callbacks: {
    done: () => void;
  }
) {
  cache.add('code', action.entrypoint.name, action.data);
  callbacks.done();
}
