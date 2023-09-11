import type { IReexport } from '@linaria/utils';
import { collectExportsAndImports } from '@linaria/utils';

import type { Entrypoint } from '../Entrypoint';
import type { IEntrypointDependency } from '../Entrypoint.types';
import type { IGetExportsAction, SyncScenarioForAction } from '../types';

export function findExportsInImports(
  entrypoint: Entrypoint,
  imports: IEntrypointDependency[]
): { entrypoint: Entrypoint; import: string }[] {
  const results: {
    entrypoint: Entrypoint;
    import: string;
  }[] = [];

  for (const imp of imports) {
    const { resolved } = imp;
    if (!resolved) {
      throw new Error(`Could not resolve import ${imp.source}`);
    }

    const newEntrypoint = entrypoint.createChild(resolved, []);

    if (newEntrypoint === 'loop') {
      // eslint-disable-next-line no-continue
      continue;
    }

    results.push({
      entrypoint: newEntrypoint,
      import: imp.source,
    });
  }

  return results;
}

export function* getExports(
  this: IGetExportsAction
): SyncScenarioForAction<IGetExportsAction> {
  const {
    entrypoint,
    services: { cache },
  } = this;
  const { loadedAndParsed } = entrypoint;
  if (loadedAndParsed.ast === undefined) {
    return [];
  }

  entrypoint.log(`get exports from %s`, entrypoint.name);

  if (cache.has('exports', entrypoint.name)) {
    return cache.get('exports', entrypoint.name)!;
  }

  let withWildcardReexport: IReexport[] = [];
  const result: string[] = [];

  this.services.babel.traverse(loadedAndParsed.ast!, {
    Program(path) {
      const { exports, reexports } = collectExportsAndImports(path, 'disabled');
      exports.forEach((e) => {
        result.push(e.exported);
      });

      reexports.forEach((e) => {
        if (e.exported !== '*') {
          result.push(e.exported);
        }
      });

      withWildcardReexport = reexports.filter((e) => e.exported === '*');
    },
  });

  if (withWildcardReexport.length) {
    const resolvedImports = yield* this.getNext('resolveImports', entrypoint, {
      imports: new Map(withWildcardReexport.map((i) => [i.source, []])),
    });

    const importedEntrypoints = findExportsInImports(
      entrypoint,
      resolvedImports
    );

    for (const importedEntrypoint of importedEntrypoints) {
      const exports = yield* this.getNext(
        'getExports',
        importedEntrypoint.entrypoint,
        undefined
      );

      result.push(...exports);
    }
  }

  cache.add('exports', entrypoint.name, result);

  return result;
}
