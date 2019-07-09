import { types as t } from '@babel/core';
import isNode from '../utils/isNode';
import getVisitorKeys from '../utils/getVisitorKeys';
import DepsGraph from './DepsGraph';
import GraphBuilderState from './GraphBuilderState';
import { getVisitor } from './Visitors';
import { VisitorAction } from './types';

class GraphBuilder extends GraphBuilderState {
  static build(root: t.Node): DepsGraph {
    const builder = new GraphBuilder();
    builder.visit(root, null, null, null);
    return builder.graph;
  }

  /*
   * Implements a default behaviour for AST-nodes:
   * • visits every child;
   * • if the current node is an Expression node, adds all its children as dependencies.
   *
   * eg. BinaryExpression has children `left` and `right`,
   * both of them are required for evaluating the value of the expression
   */
  baseVisit<TNode extends t.Node>(node: TNode, ignoreDeps = false) {
    const dependencies = [];
    const isExpression = t.isExpression(node);
    const keys = getVisitorKeys(node);
    for (const key of keys) {
      const subNode = node[key as keyof TNode];

      if (Array.isArray(subNode)) {
        for (let i = 0; i < subNode.length; i++) {
          const child = subNode[i];
          if (child && this.visit(child, node, key, i) !== 'ignore') {
            dependencies.push(child);
          }
        }
      } else if (
        isNode(subNode) &&
        this.visit(subNode, node, key) !== 'ignore'
      ) {
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
  ): VisitorAction {
    const isScopable = t.isScopable(node);
    const isFunction = t.isFunction(node);

    if (isScopable) this.scope.new();
    if (isFunction) this.fnStack.push(node);

    const visitor = getVisitor(node);
    let action: VisitorAction;
    if (visitor) {
      action = visitor.call(this, node, parent, parentKey, listIdx);
    } else {
      this.baseVisit(node);
    }

    if (parent && action !== 'ignore' && t.isDeclaration(node)) {
      // Declaration always depends on its scope
      this.graph.addEdge(node, parent);
    }

    if (isFunction) this.fnStack.pop();
    if (isScopable) this.scope.dispose();

    return action;
  }
}

export default GraphBuilder.build;
