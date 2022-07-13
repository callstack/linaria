import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';

const isTypedNode =
  <T extends NodePath['type']>(type: T) =>
  (p: NodePath): p is NodePath<Extract<Node, { type: T }>> => {
    return p.type === type;
  };

export default isTypedNode;
