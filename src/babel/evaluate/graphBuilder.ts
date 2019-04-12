import { types as t } from '@babel/core';
import isNode from '../utils/isNode';
import getVisitorKeys from '../utils/getVisitorKeys';
import DepsGraph from './DepsGraph';
import GraphBuilderState from './GraphBuilderState';
import { getVisitor } from './Visitors';

class GraphBuilder extends GraphBuilderState {
  static build(root: t.Node): DepsGraph {
    const builder = new GraphBuilder();
    builder.visit(root, null, null, null);
    return builder.graph;
  }

  baseVisit<TNode extends t.Node>(node: TNode, ignoreDeps = false) {
    const dependencies = [];
    const isExpression = t.isExpression(node);
    const keys = getVisitorKeys(node);
    for (const key of keys) {
      const subNode = node[key as keyof TNode];

      if (Array.isArray(subNode)) {
        for (let i = 0; i < subNode.length; i++) {
          const child = subNode[i];
          if (child) {
            this.visit(child, node, key, i);
            dependencies.push(child);
          }
        }
      } else if (isNode(subNode)) {
        this.visit(subNode, node, key);
        dependencies.push(subNode);
      }
    }

    if (isExpression && !ignoreDeps) {
      dependencies.forEach(dep => this.graph.addEdge(node, dep));
    }
  }

  visit<TNode extends t.Node, TParent extends t.Node>(
    node: TNode,
    parent: TParent | null,
    parentKey: t.VisitorKeys[TParent['type']] | null,
    listIdx: number | null = null
  ) {
    const isScopable = t.isScopable(node);
    const isFunction = t.isFunction(node);

    if (isScopable) this.scope.new();
    if (isFunction) this.fnStack.push(node);

    const visitor = getVisitor(node);
    if (visitor) {
      visitor.call(this, node, parent, parentKey, listIdx);
    } else {
      this.baseVisit(node);
    }

    if (isFunction) this.fnStack.pop();
    if (isScopable) this.scope.dispose();
  }
}

export default GraphBuilder.build;
