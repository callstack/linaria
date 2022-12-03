import type { NodePath } from '@babel/traverse';

import { isGlobal } from './isGlobal';

/**
 * Checks that specified Identifier is a global `exports` or `module.exports`
 * @param node
 */
export default function isExports(node: NodePath | null | undefined) {
  if (node?.isIdentifier({ name: 'exports' })) {
    return isGlobal(node, 'exports');
  }

  if (
    node?.isMemberExpression() &&
    node.get('object').isIdentifier({ name: 'module' }) &&
    node.get('property').isIdentifier({ name: 'exports' })
  ) {
    return isGlobal(node, 'module');
  }

  return false;
}
