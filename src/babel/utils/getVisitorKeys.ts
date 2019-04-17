import { types as t } from '@babel/core';

export default function getVisitorKeys<TNode extends t.Node>(
  node: TNode
): t.VisitorKeys[TNode['type']][] {
  return t.VISITOR_KEYS[node.type];
}
