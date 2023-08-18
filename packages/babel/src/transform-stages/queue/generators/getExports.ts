import type { IReexport } from '@linaria/utils';
import { collectExportsAndImports } from '@linaria/utils';

import { createEntrypoint } from '../createEntrypoint';
import type {
  IExplodeReexportsAction,
  IGetExportsAction,
  IResolvedImport,
  Next,
  Services,
  ActionGenerator,
} from '../types';

import { emitAndGetResultOf } from './helpers/emitAndGetResultOf';

export function* findExportsInImports(
  services: Services,
  action: IGetExportsAction | IExplodeReexportsAction,
  imports: IResolvedImport[]
): Generator<Parameters<Next>, Record<string, string[]>, never> {
  let results: Record<string, string[]> = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const imp of imports) {
    const { resolved } = imp;
    if (!resolved) {
      throw new Error(`Could not resolve import ${imp.importedFile}`);
    }

    const newEntrypoint = createEntrypoint(
      services,
      action.entrypoint,
      resolved,
      [],
      undefined,
      action.entrypoint.pluginOptions
    );

    if (newEntrypoint === 'ignored') {
      // eslint-disable-next-line no-continue
      continue;
    }

    const exports = yield* emitAndGetResultOf('getExports', newEntrypoint, {});
    results = {
      ...results,
      [imp.importedFile]: exports,
    };
  }

  return results;
}

export function* getExports(
  services: Services,
  action: IGetExportsAction
): ActionGenerator<IGetExportsAction> {
  const { entrypoint } = action;

  entrypoint.log(`get exports from %s`, entrypoint.name);

  let withWildcardReexport: IReexport[] = [];
  const result: string[] = [];

  services.babel.traverse(entrypoint.ast!, {
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
    const resolvedImports = yield* emitAndGetResultOf(
      'resolveImports',
      action.entrypoint,
      {
        imports: new Map(withWildcardReexport.map((i) => [i.source, []])),
      }
    );

    const exports = yield* findExportsInImports(
      services,
      action,
      resolvedImports
    );

    Object.values(exports).forEach((identifiers) => {
      result.push(...identifiers);
    });
  }

  return result;
}
