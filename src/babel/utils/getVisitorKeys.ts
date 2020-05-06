import { types as t } from '@babel/core';
import { VisitorKeys, BabelTypes$Fixme } from '../types';

type Keys<T extends t.Node> = (VisitorKeys[T['type']] & keyof T)[];

export default function getVisitorKeys<TNode extends t.Node>(
  node: TNode
): Keys<TNode> {
  return ((t as unknown) as BabelTypes$Fixme).VISITOR_KEYS[node.type] as Keys<
    TNode
  >;
}
