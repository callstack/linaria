import type { NodePath } from '@babel/traverse';

/**
 * Checks that specified Identifier is a global `require`
 * @param id
 */
export default function isRequire(id: NodePath | null | undefined) {
  if (!id?.isIdentifier() || id.node.name !== 'require') {
    return false;
  }

  return (
    id.scope.getBinding('require') === undefined &&
    id.scope.hasGlobal('require')
  );
}
