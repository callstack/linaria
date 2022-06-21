import type { NodePath } from '@babel/traverse';

/**
 * Checks that specified Identifier is a global `exports`
 * @param id
 */
export default function isExports(id: NodePath | null | undefined) {
  if (!id?.isIdentifier() || id.node.name !== 'exports') {
    return false;
  }

  return (
    id.scope.getBinding('exports') === undefined &&
    id.scope.hasGlobal('exports')
  );
}
