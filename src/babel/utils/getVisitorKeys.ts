import { types as t } from '@babel/core';
import type { Node, VisitorKeys } from '@babel/types';

type Keys<T extends Node> = (VisitorKeys[T['type']] & keyof T)[];

export default function getVisitorKeys<TNode extends Node>(
  node: TNode
): Keys<TNode> {
  return t.VISITOR_KEYS[node.type] as Keys<TNode>;
}
