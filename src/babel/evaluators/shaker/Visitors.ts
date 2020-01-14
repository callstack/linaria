import { types as t } from '@babel/core';
import peek from '../../utils/peek';
import GraphBuilderState from './GraphBuilderState';
import identifierHandlers from './identifierHandlers';
import { Visitor, Visitors } from './types';

import { visitors as core } from './langs/core';
import { warn } from '../../utils/logger';

const visitors: Visitors = {
  Identifier<TParent extends t.Node>(
    this: GraphBuilderState,
    node: t.Identifier,
    parent: TParent | null,
    parentKey: t.VisitorKeys[TParent['type']] | null,
    listIdx: number | null = null
  ) {
    if (!parent || !parentKey) {
      return;
    }

    const handler = identifierHandlers[`${parent.type}:${parentKey}`];

    if (typeof handler === 'function') {
      handler(this, node, parent, parentKey, listIdx);
      return;
    }

    if (handler === 'keep') {
      return;
    }

    if (handler === 'declare') {
      const kindOfDeclaration = this.meta.get('kind-of-declaration');
      this.scope.declare(node, kindOfDeclaration === 'var', null);
      return;
    }

    if (handler === 'refer') {
      const declaration = this.scope.addReference(node);
      // Let's check that it's not a global variable
      if (declaration) {
        // usage of a variable depends on its declaration
        this.graph.addEdge(node, declaration);

        const context = peek(this.context);
        if (context === 'lval') {
          // This is an identifier in the left side of an assignment expression and a variable value depends on that.
          this.graph.addEdge(declaration, node);
        }
      }

      return;
    }

    /*
     * There is an unhandled identifier.
     * This case should be added to ./identifierHandlers.ts
     */
    warn('Unhandled identifier', node.name, parent.type, parentKey, listIdx);
  },

  ...core,
};

export function getVisitors<TNode extends t.Node>(
  node: TNode
): Visitor<TNode>[] {
  const aliases: Array<keyof t.Aliases> = t.ALIAS_KEYS[node.type] || [];
  const aliasVisitors = aliases
    .map(type => visitors[type])
    .filter(i => i) as Visitor<TNode>[];
  return [...aliasVisitors, visitors[node.type] as Visitor<TNode>].filter(
    v => v
  );
}

export default visitors;
