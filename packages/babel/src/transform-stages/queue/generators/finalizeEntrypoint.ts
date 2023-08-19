import { getSupersededWith } from '../createEntrypoint';
import type {
  IAddToCodeCacheAction,
  Services,
  ActionGenerator,
  IFinalizeEntrypointAction,
} from '../types';

export function* finalizeEntrypoint(
  _: Services,
  action: IFinalizeEntrypointAction
): ActionGenerator<IAddToCodeCacheAction> {
  action.finalizer();

  const supersededWith = getSupersededWith(action.entrypoint);

  if (supersededWith) {
    yield ['processEntrypoint', supersededWith, {}, null];
  }
}
