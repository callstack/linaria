/* eslint-disable no-param-reassign */
/**
 * This Visitor checks if import of `@linaria/react` was renamed and stores that information in state
 */

import type { ImportDeclaration } from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { State } from '../types';
import { Core } from '../babel';

export default function DetectStyledImportName(
  { types: t }: Core,
  path: NodePath<ImportDeclaration>,
  state: State
) {
  if (!t.isLiteral(path.node.source, { value: '@linaria/react' })) {
    return;
  }

  path.node.specifiers.forEach((specifier) => {
    if (!t.isImportSpecifier(specifier)) {
      return;
    }

    const importedName = t.isStringLiteral(specifier.imported)
      ? specifier.imported.value
      : specifier.imported.name;

    if (specifier.local.name !== importedName) {
      state.file.metadata.localName = specifier.local.name;
    }
  });
}
