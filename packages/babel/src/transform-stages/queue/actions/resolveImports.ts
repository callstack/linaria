/* eslint-disable no-restricted-syntax,no-continue,no-await-in-loop */
import type {
  IResolveImportsAction,
  Services,
  IResolvedImport,
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

export function syncResolveImports(
  resolve: (what: string, importer: string, stack: string[]) => string,
  { eventEmitter }: Services,
  action: IResolveImportsAction
) {
  const { imports, entrypoint } = action;
  const listOfImports = Array.from(imports?.entries() ?? []);
  const { log } = entrypoint;

  if (listOfImports.length > 0) {
    const resolvedImports = listOfImports.map(([importedFile, importsOnly]) => {
      let resolved: string | null = null;
      try {
        resolved = resolve(importedFile, entrypoint.name, action.stack);
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

    eventEmitter.single({
      type: 'dependency',
      file: entrypoint.name,
      only: entrypoint.only,
      imports: resolvedImports.map(({ resolved, importsOnly }) => ({
        from: resolved,
        what: importsOnly,
      })),
    });

    action.callback?.(resolvedImports);
  } else {
    eventEmitter.single({
      type: 'dependency',
      file: entrypoint.name,
      only: entrypoint.only,
      imports: [],
    });

    log('%s has no imports', entrypoint.name);
    action.callback?.([]);
  }
}

export async function asyncResolveImports(
  resolve: (
    what: string,
    importer: string,
    stack: string[]
  ) => Promise<string | null>,
  { cache, eventEmitter }: Services,
  action: IResolveImportsAction
) {
  const { imports, entrypoint } = action;
  const listOfImports = Array.from(imports?.entries() ?? []);
  const { log } = entrypoint;

  if (listOfImports.length > 0) {
    log('resolving %d imports', listOfImports.length);

    const getResolveTask = async (
      importedFile: string,
      importsOnly: string[]
    ) => {
      let resolved: string | null = null;
      try {
        resolved = await resolve(importedFile, entrypoint.name, action.stack);
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

    const resolvedImports: IResolvedImport[] = await Promise.all(
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

    eventEmitter.single({
      type: 'dependency',
      file: entrypoint.name,
      only: entrypoint.only,
      imports: resolvedImports.map(({ resolved, importsOnly }) => ({
        from: resolved,
        what: importsOnly,
      })),
    });

    action.callback?.(resolvedImports);
  } else {
    eventEmitter.single({
      type: 'dependency',
      file: entrypoint.name,
      only: entrypoint.only,
      imports: [],
    });

    log('%s has no imports', entrypoint.name);
    action.callback?.([]);
  }
}
