import { types as t } from '@babel/core';
import GraphBuilderState from './GraphBuilderState';
import { VisitorAction } from './types';

export const ignore = () => (): VisitorAction => 'ignore';

export const replace = <TNode extends t.Node>(
  by: t.VisitorKeys[TNode['type']] & keyof TNode
) =>
  function replaced<TParent extends t.Node>(
    this: GraphBuilderState,
    node: TNode,
    parent: TParent | null = null,
    parentKey: t.VisitorKeys[TParent['type']] | null
  ): VisitorAction {
    // We use `any` here because
    // it seems to be impossible to create correct typings for VisitorKeys
    const newNode: t.Node = node[by] as any;
    if (!newNode) {
      return;
    }

    this.graph.replace(node, newNode);
    this.visit(newNode, parent, parentKey);
  };
