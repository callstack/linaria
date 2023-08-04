/* eslint-disable no-restricted-syntax,no-continue,no-await-in-loop */
import type { Next } from '../../helpers/ActionQueue';
import { createEntrypoint } from '../createEntrypoint';
import type { IProcessImportsAction, Services } from '../types';

export function processImports(
  { babel, cache, options, eventEmitter }: Services,
  action: IProcessImportsAction,
  next: Next
) {
  const { resolved: resolvedImports, entrypoint, stack } = action;

  for (const { importedFile, importsOnly, resolved } of resolvedImports) {
    if (resolved === null) {
      entrypoint.log(
        `[resolve] ✅ %s in %s is ignored`,
        importedFile,
        entrypoint.name
      );
      continue;
    }

    const resolveCacheKey = `${entrypoint.name} -> ${importedFile}`;
    const resolveCached = cache.get('resolve', resolveCacheKey);
    const importsOnlySet = new Set(importsOnly);
    if (resolveCached) {
      const [, cachedOnly] = resolveCached.split('\0');
      cachedOnly?.split(',').forEach((token) => {
        if (token) {
          importsOnlySet.add(token);
        }
      });
    }

    cache.add(
      'resolve',
      resolveCacheKey,
      `${resolved}\0${[...importsOnlySet].join(',')}`
    );

    const nextEntrypoint = createEntrypoint(
      babel,
      entrypoint.log,
      cache,
      resolved,
      [...importsOnlySet],
      undefined,
      entrypoint.pluginOptions,
      options,
      eventEmitter
    );
    if (nextEntrypoint === 'ignored') {
      continue;
    }

    next({
      type: 'processEntrypoint',
      entrypoint: nextEntrypoint,
      stack: [entrypoint.name, ...stack],
    });
  }
}
