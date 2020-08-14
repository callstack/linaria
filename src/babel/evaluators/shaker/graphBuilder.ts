import { types as t } from '@babel/core';
import type { AssignmentExpression, Node, VisitorKeys } from '@babel/types';
import isNode from '../../utils/isNode';
import getVisitorKeys from '../../utils/getVisitorKeys';
import DepsGraph from './DepsGraph';
import GraphBuilderState from './GraphBuilderState';
import { getVisitors } from './Visitors';
import type { VisitorAction } from './types';
import ScopeManager from './scope';

const isVoid = (node: Node): boolean =>
  t.isUnaryExpression(node) && node.operator === 'void';

class GraphBuilder extends GraphBuilderState {
  static build(root: Node): DepsGraph {
    return new GraphBuilder(root).graph;
  }

  constructor(rootNode: Node) {
    super();

    this.visit(rootNode, null, null, null);
  }

  private isExportsIdentifier(node: Node) {
    if (
      t.isIdentifier(node) &&
      this.scope.getDeclaration(node) === ScopeManager.globalExportsIdentifier
    ) {
      return true;
    }

    return (
      t.isMemberExpression(node) &&
      t.isIdentifier(node.property) &&
      node.property.name === 'exports' &&
      t.isIdentifier(node.object) &&
      this.scope.getDeclaration(node.object) ===
        ScopeManager.globalModuleIdentifier
    );
  }

  private isExportsAssigment(node: Node): node is AssignmentExpression {
    if (
      node &&
      t.isAssignmentExpression(node) &&
      t.isMemberExpression(node.left)
    ) {
      if (this.isExportsIdentifier(node.left)) {
        // This is a default export like `module.exports = 42`
        return true;
      }

      if (this.isExportsIdentifier(node.left.object)) {
        // This is a named export like `module.exports.a = 42` or `exports.a = 42`
        return true;
      }
    }

    return false;
  }

  /*
   * Implements a default behaviour for AST-nodes:
   * • visits every child;
   * • if the current node is an Expression node, adds all its children as dependencies.
   *
   * eg. BinaryExpression has children `left` and `right`,
   * both of them are required for evaluating the value of the expression
   */
  baseVisit<TNode extends Node>(node: TNode, ignoreDeps = false) {
    const dependencies = [];
    const isExpression = t.isExpression(node);
    const keys = getVisitorKeys(node);
    for (const key of keys) {
      // Ignore all types
      if (key === 'typeArguments' || key === 'typeParameters') {
        continue;
      }

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
      dependencies.forEach((dep) => this.graph.addEdge(node, dep));
    }

    this.callbacks.forEach((callback) => callback(node));
  }

  visit<TNode extends Node, TParent extends Node>(
    node: TNode,
    parent: TParent | null,
    parentKey: VisitorKeys[TParent['type']] | null,
    listIdx: number | null = null
  ): VisitorAction {
    if (
      this.isExportsAssigment(node) &&
      !this.isExportsAssigment(node.right) &&
      !isVoid(node.right)
    ) {
      if (
        t.isMemberExpression(node.left) &&
        t.isIdentifier(node.left.property)
      ) {
        if (
          t.isIdentifier(node.left.object) &&
          node.left.object.name === 'module'
        ) {
          // It's a batch or default export
          if (t.isObjectExpression(node.right)) {
            // Batch export is a very particular case.
            // Each property of the assigned object is independent named export.
            // We also need to specify all dependencies and call `visit` for every value.
            this.visit(node.left, node, 'left');
            node.right.properties.forEach((prop) => {
              if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                this.visit(prop.value, prop, 'value');
                this.graph.addExport(prop.key.name, prop);
                this.graph.addEdge(prop, node.right);
                this.graph.addEdge(prop, prop.key);
                this.graph.addEdge(prop.key, prop.value);
              }
            });

            this.graph.addEdge(node.right, node);
            this.graph.addEdge(node, node.left);

            // We have done all the required work, so stop here
            return;
          } else {
            this.graph.addExport('default', node);
          }
        } else {
          this.graph.addExport(node.left.property.name, node);
        }
      }
    }

    const isScopable = t.isScopable(node);
    const isFunction = t.isFunction(node);

    if (isScopable) this.scope.new(t.isProgram(node) || t.isFunction(node));
    if (isFunction) this.fnStack.push(node);

    const visitors = getVisitors(node);
    let action: VisitorAction;
    if (visitors.length > 0) {
      let visitor;
      while (!action && (visitor = visitors.shift())) {
        action = visitor.call(this, node, parent, parentKey, listIdx);
      }
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
