import { types as t } from '@babel/core';
import type { AssignmentExpression, Node } from '@babel/types';
import { isNode, getVisitorKeys } from '@linaria/babel-preset';
import type { VisitorKeys } from '@linaria/babel-preset';
import type DepsGraph from './DepsGraph';
import GraphBuilderState from './GraphBuilderState';
import { getVisitors } from './Visitors';
import type { VisitorAction, Visitor } from './types';
import ScopeManager from './scope';

const isVoid = (node: Node): boolean =>
  t.isUnaryExpression(node) && node.operator === 'void';

function isTSExporterCall(
  node: Node
): node is t.CallExpression & { arguments: [t.StringLiteral, t.Identifier] } {
  if (!t.isCallExpression(node) || node.arguments.length !== 2) {
    return false;
  }

  // FIXME: more precisely check
  return !(!t.isIdentifier(node.callee) || node.callee.name !== 'exporter');
}

class GraphBuilder extends GraphBuilderState {
  static build(root: Node): DepsGraph {
    return new GraphBuilder(root).graph;
  }

  constructor(rootNode: Node) {
    super();

    this.visit(rootNode, null, null, null);
  }

  private isExportsIdentifier(node: Node) {
    if (t.isIdentifier(node)) {
      return (
        this.scope.getDeclaration(node) === ScopeManager.globalExportsIdentifier
      );
    }

    if (t.isMemberExpression(node)) {
      return (
        t.isIdentifier(node.property) &&
        node.property.name === 'exports' &&
        t.isIdentifier(node.object) &&
        this.scope.getDeclaration(node.object) ===
          ScopeManager.globalModuleIdentifier
      );
    }

    return false;
  }

  private isExportsAssignment(node: Node): node is AssignmentExpression {
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
    const dependencies: t.Node[] = [];
    const isExpression = t.isExpression(node);
    const keys = getVisitorKeys(node);
    keys.forEach((key) => {
      // Ignore all types
      if (key === 'typeArguments' || key === 'typeParameters') {
        return;
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
    });

    if (isExpression && !ignoreDeps) {
      dependencies.forEach((dep) => this.graph.addEdge(node, dep));
    }

    this.callbacks.forEach((callback) => callback(node));
  }

  visit<TNode extends Node, TParent extends Node>(
    node: TNode,
    parent: TParent | null,
    parentKey: VisitorKeys<TParent> | null,
    listIdx: number | null = null
  ): VisitorAction {
    if (parent) {
      this.graph.addParent(node, parent);
    }

    if (
      this.isExportsAssignment(node) &&
      !this.isExportsAssignment(node.right) &&
      !isVoid(node.right)
    ) {
      if (
        t.isMemberExpression(node.left) &&
        (t.isIdentifier(node.left.property) ||
          t.isStringLiteral(node.left.property))
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
            this.visit(
              node.left,
              node,
              'left' as VisitorKeys<TNode & AssignmentExpression>
            );
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
          } else {
            this.graph.addExport('default', node);
            this.graph.addEdge(node, node.left);
          }
          // Regardless of whether the node.right is an object expression, this may also be the default export
          this.graph.addExport('default', node);
        } else {
          // it can be either `exports.name` or `exports["name"]`
          const nameNode = node.left.property;
          this.graph.addExport(
            t.isStringLiteral(nameNode) ? nameNode.value : nameNode.name,
            node
          );
        }
      }
    } else if (isTSExporterCall(node)) {
      const [name, identifier] = node.arguments;
      this.graph.addExport(name.value, node);
      this.graph.addEdge(node, identifier);
    } else if (t.isVariableDeclaration(node)) {
      // We might be assigning to the exports, eg. `var Padding = exports.Padding = ...`
      // or it might be a sequence and look like var foo = 1, var Name = exports.name = ...
      node.declarations.forEach((declaration) => {
        if (
          t.isVariableDeclarator(declaration) &&
          t.isAssignmentExpression(declaration.init)
        ) {
          let currentAssignmentExpression: t.Expression = declaration.init;
          let addedExport = false;
          const edgesToAdd = [];

          // loop through the assignments looking for possible exports
          while (t.isAssignmentExpression(currentAssignmentExpression)) {
            edgesToAdd.push(currentAssignmentExpression);
            if (
              this.isExportsAssignment(currentAssignmentExpression) &&
              t.isMemberExpression(currentAssignmentExpression.left) &&
              (t.isIdentifier(currentAssignmentExpression.left.property) ||
                t.isStringLiteral(currentAssignmentExpression.left.property))
            ) {
              const nameNode = currentAssignmentExpression.left.property;
              this.graph.addExport(
                t.isStringLiteral(nameNode) ? nameNode.value : nameNode.name,
                node
              );
              addedExport = true;
              edgesToAdd.push(declaration);
              edgesToAdd.push(currentAssignmentExpression.left);
              edgesToAdd.push(currentAssignmentExpression.right);
            }

            currentAssignmentExpression = currentAssignmentExpression.right;
          }
          if (addedExport) {
            edgesToAdd.forEach((edge) => {
              this.graph.addEdge(node, edge);
            });
          }
        }
      });
    }

    const isScopable = t.isScopable(node);
    const isFunction = t.isFunction(node);

    if (isScopable) this.scope.new(t.isProgram(node) || t.isFunction(node));
    if (isFunction) this.fnStack.push(node);

    const visitors = getVisitors(node);
    let action: VisitorAction;
    if (visitors.length > 0) {
      let visitor: Visitor<TNode> | undefined;
      // eslint-disable-next-line no-cond-assign
      while (!action && (visitor = visitors.shift())) {
        const method: Visitor<TNode> = visitor.bind(this);
        action = method(node, parent, parentKey, listIdx);
      }
    } else {
      this.baseVisit(node);
    }

    if (parent && action !== 'ignore' && t.isStatement(node)) {
      // Statement always depends on its parent
      this.graph.addEdge(node, parent);
    }

    if (isFunction) this.fnStack.pop();
    if (isScopable) this.scope.dispose();

    return action;
  }
}

export default GraphBuilder.build;
