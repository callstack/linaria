import type { NodePath } from '@babel/traverse';
import type { V8IntrinsicIdentifier, Expression } from '@babel/types';

/**
 * Checks that specified Identifier is a global `require`
 * @param id
 */
export default function isRequire(
  id: NodePath<V8IntrinsicIdentifier | Expression>
) {
  if (!id.isIdentifier() || id.node.name !== 'require') {
    return false;
  }

  return (
    id.scope.getBinding('require') === undefined &&
    id.scope.hasGlobal('require')
  );
}
