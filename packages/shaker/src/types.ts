import type { Aliases, Node, VisitorKeys } from '@babel/types';

export type NodeOfType<T> = Extract<Node, { type: T }>;

export type NodeType = Node['type'] | keyof Aliases;

export type VisitorAction = 'ignore' | void;

export type Visitor<TNode extends Node> = <TParent extends Node>(
  node: TNode,
  parent: TParent | null,
  parentKey: VisitorKeys[TParent['type']] | null,
  listIdx: number | null
) => VisitorAction;

export type Visitors = { [TMethod in NodeType]?: Visitor<NodeOfType<TMethod>> };

export type IdentifierHandlerType = 'declare' | 'keep' | 'refer';

export type IdentifierHandlers = {
  [key in IdentifierHandlerType]: [NodeType, ...string[]][];
};
