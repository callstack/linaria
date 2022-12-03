import type { NodePath } from '@babel/traverse';

import { getScope } from './getScope';

export const isGlobal = (node: NodePath, name: string) => {
  const scope = getScope(node);

  return scope.getBinding(name) === undefined && scope.hasGlobal(name);
};
