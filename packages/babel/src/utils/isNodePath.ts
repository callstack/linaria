import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';

export default function isNodePath<T extends Node>(
  obj: NodePath<T> | T
): obj is NodePath<T> {
  return 'node' in obj && obj?.node !== undefined;
}
