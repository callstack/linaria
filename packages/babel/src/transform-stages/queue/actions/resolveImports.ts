/* eslint-disable no-restricted-syntax,no-continue,no-await-in-loop */
import { getFileIdx } from '@linaria/utils';

import { getStack } from '../createEntrypoint';
import type {
  IResolveImportsAction,
  Services,
  IResolvedImport,
  IBaseEntrypoint,
} from '../types';

const includes = (a: string[], b: string[]) => {
  if (a.includes('*')) return true;
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
};

const mergeImports = (a: string[], b: string[]) => {
  const result = new Set(a);
  b.forEach((item) => result.add(item));
  return [...result].filter((i) => i).sort();
};

function emitDependency(
  emitter: Services['eventEmitter'],
  entrypoint: IResolveImportsAction['entrypoint'],
  imports: IResolvedImport[]
) {
  emitter.single({
    type: 'dependency',
    file: entrypoint.name,
    only: entrypoint.only,
    imports: imports.map(({ resolved, importsOnly }) => ({
      from: resolved,
      what: importsOnly,
    })),
    fileIdx: getFileIdx(entrypoint.name).toString().padStart(5, '0'),
  });
}

function addToCache(
  cache: Services['cache'],
  entrypoint: IBaseEntrypoint,
  resolvedImports: {
    importedFile: string;
    importsOnly: string[];
    resolved: string | null;
  }[]
) {
  const filteredImports = resolvedImports.filter((i): i is IResolvedImport => {
    if (i.resolved === null) {
      entrypoint.log(
        `[resolve] ✅ %s in %s is ignored`,
        i.importedFile,
        entrypoint.name
      );
      return false;
    }

    return true;
  });

  return filteredImports.map(({ importedFile, importsOnly, resolved }) => {
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

    return {
      importedFile,
      importsOnly: [...importsOnlySet],
      resolved,
    };
  });
}

/**
 * Synchronously resolves specified imports with a provided resolver.
 */
export function syncResolveImports(
  resolve: (what: string, importer: string, stack: string[]) => string,
  { cache, eventEmitter }: Services,
  action: IResolveImportsAction,
  callbacks: { resolve: (result: IResolvedImport[]) => void }
) {
  const { imports, entrypoint } = action;
  const listOfImports = Array.from(imports?.entries() ?? []);
  const { log } = entrypoint;

  if (listOfImports.length === 0) {
    emitDependency(eventEmitter, entrypoint, []);

    log('%s has no imports', entrypoint.name);
    callbacks.resolve([]);
    return;
  }

  const resolvedImports = listOfImports.map(([importedFile, importsOnly]) => {
    let resolved: string | null = null;
    try {
      resolved = resolve(
        importedFile,
        entrypoint.name,
        getStack(action.entrypoint)
      );
      log(
        '[sync-resolve] ✅ %s -> %s (only: %o)',
        importedFile,
        resolved,
        importsOnly
      );
    } catch (err) {
      log('[sync-resolve] ❌ cannot resolve %s: %O', importedFile, err);
    }

    return {
      importedFile,
      importsOnly,
      resolved,
    };
  });

  const filteredImports = addToCache(cache, entrypoint, resolvedImports);
  emitDependency(eventEmitter, entrypoint, filteredImports);
  callbacks.resolve(filteredImports);
}

/**
 * Asynchronously resolves specified imports with a provided resolver.
 */
export async function asyncResolveImports(
  resolve: (
    what: string,
    importer: string,
    stack: string[]
  ) => Promise<string | null>,
  { cache, eventEmitter }: Services,
  action: IResolveImportsAction,
  callbacks: { resolve: (result: IResolvedImport[]) => void }
) {
  const { imports, entrypoint } = action;
  const listOfImports = Array.from(imports?.entries() ?? []);
  const { log } = entrypoint;

  if (listOfImports.length === 0) {
    emitDependency(eventEmitter, entrypoint, []);

    log('%s has no imports', entrypoint.name);
    callbacks.resolve([]);
    return;
  }

  log('resolving %d imports', listOfImports.length);

  const getResolveTask = async (
    importedFile: string,
    importsOnly: string[]
  ) => {
    let resolved: string | null = null;
    try {
      resolved = await resolve(
        importedFile,
        entrypoint.name,
        getStack(action.entrypoint)
      );
    } catch (err) {
      log(
        '[async-resolve] ❌ cannot resolve %s in %s: %O',
        importedFile,
        entrypoint.name,
        err
      );
    }

    if (resolved !== null) {
      log(
        '[async-resolve] ✅ %s (%o) in %s -> %s',
        importedFile,
        importsOnly,
        entrypoint.name,
        resolved
      );
    }

    return {
      importedFile,
      importsOnly,
      resolved,
    };
  };

  const resolvedImports = await Promise.all(
    listOfImports.map(([importedFile, importsOnly]) => {
      const resolveCacheKey = `${entrypoint.name} -> ${importedFile}`;

      const cached = cache.get('resolve', resolveCacheKey);
      if (cached) {
        const [cachedResolved, cachedOnly] = cached.split('\0');
        return {
          importedFile,
          importsOnly: mergeImports(importsOnly, cachedOnly.split(',')),
          resolved: cachedResolved,
        };
      }

      const cachedTask = cache.get('resolveTask', resolveCacheKey);
      if (cachedTask) {
        // If we have cached task, we need to merge importsOnly…
        const newTask = cachedTask.then((res) => {
          if (includes(res.importsOnly, importsOnly)) {
            return res;
          }

          const merged = mergeImports(res.importsOnly, importsOnly);

          log(
            'merging imports %o and %o: %o',
            importsOnly,
            res.importsOnly,
            merged
          );

          cache.add(
            'resolve',
            resolveCacheKey,
            `${res.resolved}\0${merged.join(',')}`
          );

          return { ...res, importsOnly: merged };
        });

        // … and update the cache
        cache.add('resolveTask', resolveCacheKey, newTask);
        return newTask;
      }

      const resolveTask = getResolveTask(importedFile, importsOnly).then(
        (res) => {
          cache.add(
            'resolve',
            resolveCacheKey,
            `${res.resolved}\0${importsOnly.join(',')}`
          );

          return res;
        }
      );

      cache.add('resolveTask', resolveCacheKey, resolveTask);

      return resolveTask;
    })
  );

  log('resolved %d imports', resolvedImports.length);

  const filteredImports = addToCache(cache, entrypoint, resolvedImports);
  emitDependency(eventEmitter, entrypoint, filteredImports);
  callbacks.resolve(filteredImports);
}
