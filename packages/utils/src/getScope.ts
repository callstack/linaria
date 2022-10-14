import type { NodePath } from '@babel/traverse';

export function getScope(path: NodePath) {
  // If path is a something like a function name, we should use parent scope
  return path.key === 'id' && path.parent === path.scope.block
    ? path.scope.parent
    : path.scope;
}
