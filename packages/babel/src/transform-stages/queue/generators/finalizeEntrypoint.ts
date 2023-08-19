import type {
  IAddToCodeCacheAction,
  ActionGenerator,
  IFinalizeEntrypointAction,
} from '../types';

// eslint-disable-next-line require-yield
export function* finalizeEntrypoint(
  _services: unknown,
  action: IFinalizeEntrypointAction
): ActionGenerator<IAddToCodeCacheAction> {
  action.finalizer();
}
