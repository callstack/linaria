/* eslint-disable no-param-reassign */
/**
 * This Visitor checks if import of `@linaria/react` was renamed and stores that information in state
 */

import type { ImportDeclaration } from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { State } from '../types';
import { Core } from '../babel';

function getLocalImportName(
  { types: t }: Core,
  path: NodePath<ImportDeclaration>,
  importedName?: string
) {
  let localName: string | undefined = undefined;

  path.node.specifiers.forEach((specifier) => {
    if (!t.isImportSpecifier(specifier)) {
      return;
    }

    const specifierImportedName = t.isStringLiteral(specifier.imported)
      ? specifier.imported.value
      : specifier.imported.name;

    // If we're checking for a specific import's local name, only look at that import specifier.
    if (importedName && specifierImportedName !== importedName) {
      return;
    }

    if (specifier.local.name !== specifierImportedName) {
      localName = specifier.local.name;
    }
  });

  return localName;
}

export default function DetectLinariaImportName(
  core: Core,
  path: NodePath<ImportDeclaration>,
  state: State
) {
  const { types: t } = core;
  if (t.isLiteral(path.node.source, { value: '@linaria/react' })) {
    const localImportName = getLocalImportName(core, path);
    if (localImportName) {
      state.file.metadata.localName ||= {};
      state.file.metadata.localName.styled = localImportName;
    }
  } else if (
    t.isLiteral(path.node.source, { value: '@linaria/core' }) ||
    t.isLiteral(path.node.source, { value: 'linaria' })
  ) {
    const localImportName = getLocalImportName(core, path, 'css');
    if (localImportName) {
      state.file.metadata.localName ||= {};
      state.file.metadata.localName.coreCss = localImportName;
    }
  } else if (t.isLiteral(path.node.source, { value: '@linaria/atomic' })) {
    const localImportName = getLocalImportName(core, path, 'css');
    if (localImportName) {
      state.file.metadata.localName ||= {};
      state.file.metadata.localName.atomicCss = localImportName;
    } else {
      const localImportName = getLocalImportName(core, path);
      if (localImportName) {
        state.file.metadata.localName ||= {};
        state.file.metadata.localName.atomicStyled = localImportName;
      }
    }
  }
}
