import type { IReexport } from '@linaria/utils';
import { collectExportsAndImports } from '@linaria/utils';

import type { Entrypoint } from '../Entrypoint';
import type { IResolvedImport } from '../actions/types';
import type { IGetExportsAction, SyncScenarioForAction } from '../types';

export function findExportsInImports(
  entrypoint: Entrypoint<'sync'>,
  imports: IResolvedImport[]
): { import: string; entrypoint: Entrypoint<'sync'> }[] {
  const results: { import: string; entrypoint: Entrypoint<'sync'> }[] = [];

  for (const imp of imports) {
    const { resolved } = imp;
    if (!resolved) {
      throw new Error(`Could not resolve import ${imp.importedFile}`);
    }

    const newEntrypoint = entrypoint.createChild(resolved, []);

    if (newEntrypoint === 'ignored') {
      // eslint-disable-next-line no-continue
      continue;
    }

    results.push({
      import: imp.importedFile,
      entrypoint: newEntrypoint,
    });
  }

  return results;
}

export function* getExports(
  this: IGetExportsAction<'sync'>
): SyncScenarioForAction<IGetExportsAction<'sync'>> {
  const { entrypoint } = this;

  entrypoint.log(`get exports from %s`, entrypoint.name);

  let withWildcardReexport: IReexport[] = [];
  const result: string[] = [];

  this.services.babel.traverse(entrypoint.ast!, {
    Program(path) {
      const { exports, reexports } = collectExportsAndImports(path);
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
    const resolvedImports = yield* this.getNext(
      'resolveImports',
      this.entrypoint,
      {
        imports: new Map(withWildcardReexport.map((i) => [i.source, []])),
      }
    );

    const importedEntrypoints = findExportsInImports(
      this.entrypoint,
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

  return result;
}
