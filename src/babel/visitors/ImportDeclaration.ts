/* eslint-disable no-param-reassign */

import { types as t } from '@babel/core';
import { NodePath } from '@babel/traverse';
import { State } from '../types';

export default function ImportDeclaration(
  path: NodePath<t.ImportDeclaration>,
  state: State
) {
  if (!t.isLiteral(path.node.source, { value: 'linaria/react' })) return;

  path.node.specifiers.forEach(specifier => {
    if (!t.isImportSpecifier(specifier)) return;

    if (specifier.local.name !== specifier.imported.name) {
      state.file.metadata.localName = specifier.local.name;
    }
  });
}
