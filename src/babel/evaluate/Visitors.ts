import { types as t } from '@babel/core';
import peek from '../utils/peek';
import GraphBuilderState from './GraphBuilderState';
import identifierHandlers from './identifierHandlers';

export type NodeOfType<T> = Extract<t.Node, { type: T }>;

export type Visitor<TNode extends t.Node> = <TParent extends t.Node>(
  node: TNode,
  parent: TParent | null,
  parentKey: t.VisitorKeys[TParent['type']] | null,
  listIdx: number | null
) => void;

export type Visitors = { [TMethod in t.Node['type']]?: Visitor<NodeOfType<TMethod>> };

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
      this.scope.declare(node);
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
     * Some helpful information can be printed by
     * console.log(node.name, parent.type, parentKey, listIdx);
     */
  },

  ReturnStatement(this: GraphBuilderState, node: t.ReturnStatement) {
    this.baseVisit(node);
    if (node.argument) {
      this.graph.addEdge(node, node.argument);
    }

    // Closest function depends on the return statement
    this.graph.addEdge(peek(this.fnStack), node);
  },

  ThrowStatement(this: GraphBuilderState, node: t.ThrowStatement) {
    this.baseVisit(node);
    this.graph.addEdge(node, node.argument);

    // Closest function depends on the throw statement
    this.graph.addEdge(peek(this.fnStack), node);
  },

  ExpressionStatement(this: GraphBuilderState, node: t.ExpressionStatement) {
    this.baseVisit(node);
    this.graph.addEdge(node.expression, node);
  },

  Program(this: GraphBuilderState, node: t.Program) {
    this.baseVisit(node);
    node.body.forEach(exp => {
      this.graph.addEdge(exp, node);
    });
  },

  ObjectExpression(this: GraphBuilderState, node: t.ObjectExpression) {
    this.context.push('expression');
    this.baseVisit(node);
    node.properties.forEach(prop => {
      this.graph.addEdge(node, prop);
      if (t.isObjectMethod(prop)) {
        this.graph.addEdge(prop, prop.key);
        this.graph.addEdge(prop, prop.body);
      } else if (t.isObjectProperty(prop)) {
        this.graph.addEdge(prop, prop.key);
        this.graph.addEdge(prop, prop.value);
      } else if (t.isSpreadElement(prop)) {
        this.graph.addEdge(prop, prop.argument);
      }
    });
    this.context.pop();
  },

  ObjectPattern(this: GraphBuilderState, node: t.ObjectPattern) {
    this.context.push('pattern');
    this.baseVisit(node);
    node.properties.forEach(prop => {
      this.graph.addEdge(prop, node);
      if (t.isObjectProperty(prop)) {
        this.graph.addEdge(prop.value, prop.key);
        this.graph.addEdge(prop.value, prop);
      } else if (t.isSpreadElement(prop)) {
        this.graph.addEdge(prop.argument, prop);
      }
    });
    this.context.pop();
  },

  MemberExpression(this: GraphBuilderState, node: t.MemberExpression) {
    this.baseVisit(node);
    this.graph.addEdge(node.object, node);
  },

  AssignmentExpression(this: GraphBuilderState, node: t.AssignmentExpression) {
    this.context.push('lval');
    this.visit<t.AssignmentExpression['left'], t.AssignmentExpression>(
      node.left,
      node,
      'left'
    );
    this.context.pop();

    this.visit(node.right, node, 'right');

    this.graph.addEdge(node, node.left);
    this.graph.addEdge(node, node.right);
    this.graph.addEdge(node.left, node.right);
    this.graph.addEdge(node.left, node);
  },

  AssignmentPattern(this: GraphBuilderState, node: t.AssignmentPattern) {
    this.baseVisit(node);
    if (t.isIdentifier(node.left)) {
      this.graph.addEdge(node.left, node.right);
    } else if (t.isMemberExpression(node.left)) {
      this.graph.addEdge(node.left.property, node.right);
    }
  },

  ExportNamedDeclaration(
    this: GraphBuilderState,
    node: t.ExportNamedDeclaration
  ) {
    this.baseVisit(node);
    if (node.declaration) {
      this.graph.addEdge(node.declaration, node);
      this.graph.addEdge(node, node.declaration);
    }
  },

  ImportDeclaration(this: GraphBuilderState, node: t.ImportDeclaration) {
    this.baseVisit(node);
    node.specifiers.forEach(specifier => {
      this.graph.addEdge(specifier, node);
      this.graph.externalDeps.push({
        source: node.source.value,
        local: specifier.local,
        imported: t.isImportSpecifier(specifier) ? specifier.imported : null,
      });
    });
  },

  ImportDefaultSpecifier(
    this: GraphBuilderState,
    node: t.ImportDefaultSpecifier
  ) {
    this.baseVisit(node);
    this.graph.addEdge(node.local, node);
  },

  ImportSpecifier(this: GraphBuilderState, node: t.ImportSpecifier) {
    this.baseVisit(node);
    this.graph.addEdge(node.local, node.imported);
    this.graph.addEdge(node.imported, node);
  },

  VariableDeclarator(
    this: GraphBuilderState,
    node: t.VariableDeclarator,
    parent: t.Node | null = null
  ) {
    /*
     * declared is used for detecting external dependencies in cases like
     * const { a, b, c } = require('module');
     *
     * We are remembering all declared variables in order to use it later in CallExpression visitor
     */
    const declared: t.Identifier[] = [];
    this.meta.set('declared', declared);
    const unregister = this.scope.addDeclareHandler(identifier =>
      declared.push(identifier)
    );
    this.baseVisit(node);
    this.meta.delete('declared');
    unregister();

    if (node.init) {
      this.graph.addEdge(node.id, node.init);
      this.graph.addEdge(node, node.init);
    }

    this.graph.addEdge(node.id, node);
    if (parent) {
      this.graph.addEdge(node, parent);
    }
  },

  CallExpression(this: GraphBuilderState, node: t.CallExpression) {
    this.baseVisit(node);

    if (t.isIdentifier(node.callee) && node.callee.name === 'require') {
      // It looks like a module import …
      if (this.scope.whereIsDeclared(node.callee) !== 'global') {
        // … but it is just a user defined function
        return;
      }

      const [firstArg] = node.arguments;
      if (!t.isStringLiteral(firstArg)) {
        // dynamic import? Maybe someday we can do something about it
        return;
      }

      const { value: source } = firstArg;
      const declared = this.meta.get('declared') as t.Identifier[];
      if (!declared) {
        // This is a standalone `require`
        return;
      }

      declared.forEach(n =>
        this.graph.externalDeps.push({
          source,
          local: n,
          imported: null,
        })
      );
    }
  },

  SequenceExpression(this: GraphBuilderState, node: t.SequenceExpression) {
    // Sequence value depends on only last expression in the list
    this.baseVisit(node, true);
    if (node.expressions.length > 0) {
      this.graph.addEdge(node, node.expressions[node.expressions.length - 1]);
    }
  },
};

export function getVisitor<TNode extends t.Node>(
  node: TNode
): Visitor<TNode> | undefined {
  return (visitors[node.type] as Visitor<TNode>) || undefined;
}

export default visitors;
