import type { Node, VisitorKeys } from '@babel/types';
import { Core } from '../babel';

type Keys<T extends Node> = (VisitorKeys[T['type']] & keyof T)[];

export default function getVisitorKeys<TNode extends Node>(
  { types: t }: Core,
  node: TNode
): Keys<TNode> {
  return t.VISITOR_KEYS[node.type] as Keys<TNode>;
}
