import { collectExportsAndImports } from '@linaria/utils';

import type { Next } from '../../helpers/ActionQueue';
import type { IBaseNode } from '../PriorityQueue';
import { createEntrypoint } from '../createEntrypoint';
import type { IGetExportsAction, IResolvedImport, Services } from '../types';

export function findExportsInFiles(
  { babel, cache, eventEmitter, options }: Services,
  action: IBaseNode,
  next: Next,
  resolvedImports: IResolvedImport[],
  onResolved: (replacements: Record<string, string[]>) => void
) {
  resolvedImports.forEach((imp) => {
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
      eventEmitter
    );

    if (newEntrypoint === 'ignored') {
      onResolved({});
      return;
    }

    next({
      type: 'getExports',
      entrypoint: newEntrypoint,
      stack: action.stack,
      callback: (exports) => {
        onResolved({
          [imp.importedFile]: exports,
        });
      },
    });
  });
}

export function getExports(
  services: Services,
  action: IGetExportsAction,
  next: Next
) {
  const { entrypoint } = action;

  entrypoint.log(`get exports from %s`, entrypoint.name);

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

      const withWildcardReexport = reexports.filter((e) => e.exported === '*');
      if (withWildcardReexport.length) {
        let remaining = withWildcardReexport.length;
        const onResolved = (res: Record<string, string[]>) => {
          Object.values(res).forEach((identifiers) => {
            result.push(...identifiers);
          });

          remaining -= 1;
          if (remaining === 0) {
            action.callback(result);
          }
        };

        next({
          type: 'resolveImports',
          entrypoint: action.entrypoint,
          imports: new Map(withWildcardReexport.map((i) => [i.source, []])),
          stack: action.stack,
          callback: (resolvedImports) => {
            findExportsInFiles(
              services,
              action,
              next,
              resolvedImports,
              onResolved
            );
          },
        });
      } else {
        action.callback(result);
      }
    },
  });
}
