import { types as t } from '@babel/core';

export type NodeOfType<T> = Extract<t.Node, { type: T }>;

export type NodeType = t.Node['type'] | keyof t.Aliases;

export type VisitorAction = 'ignore' | void;

export type Visitor<TNode extends t.Node> = <TParent extends t.Node>(
  node: TNode,
  parent: TParent | null,
  parentKey: t.VisitorKeys[TParent['type']] | null,
  listIdx: number | null
) => VisitorAction;

export type Visitors = { [TMethod in NodeType]?: Visitor<NodeOfType<TMethod>> };

export type IdentifierHandlerType = 'declare' | 'keep' | 'refer';

export type IdentifierHandlers = {
  [key in IdentifierHandlerType]: [NodeType, ...string[]][];
};
