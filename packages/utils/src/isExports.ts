import type { NodePath } from '@babel/traverse';

import { getScope } from './getScope';

/**
 * Checks that specified Identifier is a global `exports`
 * @param id
 */
export default function isExports(id: NodePath | null | undefined) {
  if (!id?.isIdentifier() || id.node.name !== 'exports') {
    return false;
  }

  const scope = getScope(id);

  return (
    scope.getBinding('exports') === undefined && scope.hasGlobal('exports')
  );
}
