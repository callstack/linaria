import generate from '@babel/generator';
import type { ExportAllDeclaration, File, Node } from '@babel/types';

import type { Core } from '../../babel';
import type { IExplodeReexportsAction, SyncScenarioForAction } from '../types';

import { findExportsInImports } from './getExports';

const getWildcardReexport = (babel: Core, ast: File) => {
  const reexportsFrom: { node: ExportAllDeclaration; source: string }[] = [];
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
export function* explodeReexports(
  this: IExplodeReexportsAction
): SyncScenarioForAction<IExplodeReexportsAction> {
  const { babel } = this.services;
  const { log, loadedAndParsed } = this.entrypoint;
  if (loadedAndParsed.evaluator === 'ignored') {
    return;
  }

  const reexportsFrom = getWildcardReexport(babel, loadedAndParsed.ast);
  if (!reexportsFrom.length) {
    return;
  }

  log('has wildcard reexport from %o', reexportsFrom);

  const resolvedImports = yield* this.getNext(
    'resolveImports',
    this.entrypoint,
    {
      imports: new Map(reexportsFrom.map((i) => [i.source, []])),
    }
  );

  const importedEntrypoints = findExportsInImports(
    this.entrypoint,
    resolvedImports
  );

  const replacements = new Map<ExportAllDeclaration, Node | null>();
  for (const importedEntrypoint of importedEntrypoints) {
    const exports = yield* this.getNext(
      'getExports',
      importedEntrypoint.entrypoint,
      undefined
    );

    const reexport = reexportsFrom.find(
      (i) => i.source === importedEntrypoint.import
    );
    if (reexport) {
      replacements.set(
        reexport.node,
        exports.length
          ? babel.types.exportNamedDeclaration(
              null,
              exports.map((i) =>
                babel.types.exportSpecifier(
                  babel.types.identifier(i),
                  babel.types.identifier(i)
                )
              ),
              babel.types.stringLiteral(importedEntrypoint.import)
            )
          : null
      );
    }
  }

  // Replace wildcard reexport with named reexports
  babel.traverse(loadedAndParsed.ast, {
    ExportAllDeclaration(path) {
      const replacement = replacements.get(path.node);
      if (replacement) {
        path.replaceWith(replacement);
      } else {
        path.remove();
      }
    },
  });

  loadedAndParsed.code = generate(loadedAndParsed.ast).code;
}
