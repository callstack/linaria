import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';

import isNodePath from './isNodePath';

export default function unwrapNode<T extends Node>(item: NodePath<T> | T): T {
  return isNodePath(item) ? item.node : item;
}
