/* eslint-disable no-continue */
import type { IProcessImportsAction, SyncScenarioForAction } from '../types';

/**
 * Creates new entrypoints and emits processEntrypoint for each resolved import
 */
export function* processImports(
  this: IProcessImportsAction
): SyncScenarioForAction<IProcessImportsAction> {
  for (const { only, resolved } of this.data.resolved) {
    if (!resolved) {
      continue;
    }

    const nextEntrypoint = this.entrypoint.createChild(resolved, only);
    if (nextEntrypoint === 'loop' || nextEntrypoint.ignored) {
      continue;
    }

    yield* this.getNext('processEntrypoint', nextEntrypoint, undefined, null);
  }
}
