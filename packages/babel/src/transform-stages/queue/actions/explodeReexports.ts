import type { ExportAllDeclaration, Node, File } from '@babel/types';

import type { Core } from '../../../babel';
import type { IExplodeReexportsAction, Next, Services } from '../types';

import { findExportsInImports } from './getExports';

const getWildcardReexport = (babel: Core, ast: File) => {
  const reexportsFrom: { source: string; node: ExportAllDeclaration }[] = [];
  ast.program.body.forEach((node) => {
    if (
      babel.types.isExportAllDeclaration(node) &&
      node.source &&
      babel.types.isStringLiteral(node.source)
    ) {
      reexportsFrom.push({
        source: node.source.value,
        node,
      });
    }
  });

  return reexportsFrom;
};

/**
 * Replaces wildcard reexports with named reexports.
 * Recursively emits getExports for each reexported module,
 * and replaces wildcard with resolved named.
 */
export function explodeReexports(
  services: Services,
  action: IExplodeReexportsAction,
  next: Next
) {
  const { log, ast } = action.entrypoint;

  const reexportsFrom = getWildcardReexport(services.babel, ast);
  if (!reexportsFrom.length) {
    return;
  }

  log('has wildcard reexport from %o', reexportsFrom);

  const replacements = new Map<ExportAllDeclaration, Node | null>();
  const onResolved = (res: Record<string, string[]>) => {
    Object.entries(res).forEach(([source, identifiers]) => {
      const reexport = reexportsFrom.find((i) => i.source === source);
      if (reexport) {
        replacements.set(
          reexport.node,
          identifiers.length
            ? services.babel.types.exportNamedDeclaration(
                null,
                identifiers.map((i) =>
                  services.babel.types.exportSpecifier(
                    services.babel.types.identifier(i),
                    services.babel.types.identifier(i)
                  )
                ),
                services.babel.types.stringLiteral(source)
              )
            : null
        );
      }
    });

    // Replace wildcard reexport with named reexports
    services.babel.traverse(ast, {
      ExportAllDeclaration(path) {
        const replacement = replacements.get(path.node);
        if (replacement) {
          path.replaceWith(replacement);
        } else {
          path.remove();
        }
      },
    });
  };

  // Resolve modules
  next('resolveImports', action.entrypoint, {
    imports: new Map(reexportsFrom.map((i) => [i.source, []])),
  }).on('resolve', (resolvedImports) => {
    findExportsInImports(services, action, next, resolvedImports, {
      resolve: onResolved,
    });
  });
}
