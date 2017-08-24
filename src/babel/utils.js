/* @flow */

import type { NodePath } from './types';

// eslint-disable-next-line import/prefer-default-export
export function getSelfBinding(path: NodePath<any>) {
  return path.scope.getBinding(path.node.name);
}
