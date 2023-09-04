import type { File } from '@babel/types';

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

const cache = new WeakMap<File, string[]>();

export function* getExports(
  this: IGetExportsAction
): SyncScenarioForAction<IGetExportsAction> {
  const { entrypoint } = this;
  const { loadedAndParsed } = entrypoint;
  if (loadedAndParsed.evaluator === 'ignored') {
    return [];
  }

  entrypoint.log(`get exports from %s`, entrypoint.name);

  if (cache.has(loadedAndParsed.ast!)) {
    return cache.get(loadedAndParsed.ast!)!;
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

  cache.set(loadedAndParsed.ast!, result);

  return result;
}
