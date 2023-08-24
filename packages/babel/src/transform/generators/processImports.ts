/* eslint-disable no-continue */
import type { IProcessImportsAction, SyncScenarioForAction } from '../types';

/**
 * Creates new entrypoints and emits processEntrypoint for each resolved import
 */
export function* processImports(
  this: IProcessImportsAction<'sync'>
): SyncScenarioForAction<IProcessImportsAction<'sync'>> {
  for (const { importsOnly, resolved } of this.data.resolved) {
    const nextEntrypoint = this.entrypoint.createChild(resolved, importsOnly);
    if (nextEntrypoint === 'ignored') {
      continue;
    }

    yield* this.getNext('processEntrypoint', nextEntrypoint, undefined, null);
  }
}
