/* eslint-disable no-param-reassign */
/**
 * This Visitor checks if import of `linaria/react` was renamed and stores that information in state
 */

import { types as t } from '@babel/core';
import { NodePath } from '@babel/traverse';
import { State } from '../types';

export default function DetectStyledImportName(
  path: NodePath<t.ImportDeclaration>,
  state: State
) {
  if (!t.isLiteral(path.node.source, { value: 'linaria/react' })) {
    return;
  }

  path.node.specifiers.forEach((specifier) => {
    if (!t.isImportSpecifier(specifier)) {
      return;
    }
    if (specifier.local.name !== specifier.imported.name) {
      state.file.metadata.localName = specifier.local.name;
    }
  });
}
