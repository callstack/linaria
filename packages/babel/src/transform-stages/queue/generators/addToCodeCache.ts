import type {
  IAddToCodeCacheAction,
  Services,
  ActionGenerator,
} from '../types';

// eslint-disable-next-line require-yield
export function* addToCodeCache(
  { cache }: Services,
  action: IAddToCodeCacheAction
): ActionGenerator<IAddToCodeCacheAction> {
  cache.add('code', action.entrypoint.name, action.data);
}
