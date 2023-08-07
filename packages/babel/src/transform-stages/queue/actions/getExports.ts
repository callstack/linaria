import type { IReexport } from '@linaria/utils';
import { collectExportsAndImports } from '@linaria/utils';

import type { Next } from '../ActionQueue';
import { createEntrypoint } from '../createEntrypoint';
import type {
  IGetExportsAction,
  IResolvedImport,
  Services,
  BaseAction,
  ActionQueueItem,
  IEntrypoint,
} from '../types';

export function findExportsInImports(
  { babel, cache, eventEmitter, options }: Services,
  action: BaseAction,
  next: Next<IEntrypoint, ActionQueueItem>,
  imports: IResolvedImport[],
  callbacks: {
    resolve: (replacements: Record<string, string[]>) => void;
  }
) {
  let remaining = imports.length;
  let results: Record<string, string[]> = {};

  const onResolve = (res: Record<string, string[]>) => {
    results = {
      ...results,
      ...res,
    };

    remaining -= 1;

    if (remaining === 0) {
      callbacks.resolve(results);
    }
  };

  if (imports.length === 0) {
    callbacks.resolve({});
    return;
  }

  imports.forEach((imp) => {
    const { resolved } = imp;
    if (!resolved) {
      throw new Error(`Could not resolve import ${imp.importedFile}`);
    }

    const newEntrypoint = createEntrypoint(
      babel,
      action.entrypoint.log,
      cache,
      resolved,
      [],
      undefined,
      action.entrypoint.pluginOptions,
      options,
      eventEmitter,
      action.entrypoint.abortSignal
    );

    if (newEntrypoint === 'ignored') {
      onResolve({});
      return;
    }

    next({
      type: 'getExports',
      entrypoint: newEntrypoint,
      stack: [newEntrypoint.name, ...action.stack],
    }).on('resolve', (exports) => {
      onResolve({
        [imp.importedFile]: exports,
      });
    });
  });
}

export function getExports(
  services: Services,
  action: IGetExportsAction,
  next: Next<IEntrypoint, ActionQueueItem>,
  callbacks: { resolve: (result: string[]) => void }
) {
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
    const onResolved = (res: Record<string, string[]>) => {
      Object.values(res).forEach((identifiers) => {
        result.push(...identifiers);
      });

      callbacks.resolve(result);
    };

    next({
      type: 'resolveImports',
      entrypoint: action.entrypoint,
      imports: new Map(withWildcardReexport.map((i) => [i.source, []])),
      stack: action.stack,
    }).on('resolve', (resolvedImports) => {
      findExportsInImports(services, action, next, resolvedImports, {
        resolve: onResolved,
      });
    });
  } else {
    callbacks.resolve(result);
  }
}
