/* eslint-disable no-restricted-syntax,no-continue,no-await-in-loop */
import { createEntrypoint } from '../createEntrypoint';
import type { IProcessImportsAction, Services } from '../types';

/**
 * Creates new entrypoints and emits processEntrypoint for each resolved import
 */
export function processImports(
  services: Services,
  action: IProcessImportsAction
) {
  const { resolved: resolvedImports, entrypoint } = action;

  for (const { importsOnly, resolved } of resolvedImports) {
    const nextEntrypoint = createEntrypoint(
      services,
      entrypoint,
      resolved,
      importsOnly,
      undefined,
      entrypoint.pluginOptions
    );
    if (nextEntrypoint === 'ignored') {
      continue;
    }

    action.next('processEntrypoint', nextEntrypoint, {});
  }
}
