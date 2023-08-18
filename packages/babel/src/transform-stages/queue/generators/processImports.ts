/* eslint-disable no-restricted-syntax,no-continue */
import { createEntrypoint } from '../createEntrypoint';
import type {
  IProcessImportsAction,
  Services,
  ActionGenerator,
} from '../types';

/**
 * Creates new entrypoints and emits processEntrypoint for each resolved import
 */
export function* processImports(
  services: Services,
  action: IProcessImportsAction
): ActionGenerator<IProcessImportsAction> {
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

    yield ['processEntrypoint', nextEntrypoint, {}, null];
  }
}
