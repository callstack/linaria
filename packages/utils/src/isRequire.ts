import type { NodePath } from '@babel/traverse';

import { getScope } from './getScope';

/**
 * Checks that specified Identifier is a global `require`
 * @param id
 */
export default function isRequire(id: NodePath | null | undefined) {
  if (!id?.isIdentifier() || id.node.name !== 'require') {
    return false;
  }

  const scope = getScope(id);

  return (
    scope.getBinding('require') === undefined && scope.hasGlobal('require')
  );
}
