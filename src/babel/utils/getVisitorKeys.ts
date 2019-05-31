import { types as t } from '@babel/core';

type Keys<T extends t.Node> = (t.VisitorKeys[T['type']] & keyof T)[];

export default function getVisitorKeys<TNode extends t.Node>(
  node: TNode
): Keys<TNode> {
  return t.VISITOR_KEYS[node.type] as Keys<TNode>;
}
