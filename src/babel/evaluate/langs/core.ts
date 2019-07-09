import { types as t } from '@babel/core';

import { IdentifierHandlers, Visitors } from '../types';
import GraphBuilderState from '../GraphBuilderState';
import peek from '../../utils/peek';

export const visitors: Visitors = {
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

  VariableDeclarator(this: GraphBuilderState, node: t.VariableDeclarator) {
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
  },

  VariableDeclaration(this: GraphBuilderState, node: t.VariableDeclaration) {
    this.baseVisit(node);
    node.declarations.forEach(declaration =>
      this.graph.addEdge(declaration, node)
    );
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

export const identifierHandlers: IdentifierHandlers = {
  declare: [
    ['Function', 'params'],
    ['RestElement', 'argument'],
    ['VariableDeclarator', 'id'],
  ],
  keep: [['MemberExpression', 'property'], ['ObjectProperty', 'key']],
  refer: [
    ['AssignmentExpression', 'left'],
    ['AssignmentExpression', 'right'],
    ['BinaryExpression', 'left'],
    ['BinaryExpression', 'right'],
    ['CallExpression', 'arguments'],
    ['CallExpression', 'callee'],
    ['Function', 'body'],
    ['LogicalExpression', 'left'],
    ['LogicalExpression', 'right'],
    ['MemberExpression', 'property'],
    ['MemberExpression', 'object'],
    ['NewExpression', 'callee'],
    ['ReturnStatement', 'argument'],
    ['SequenceExpression', 'expressions'],
    ['VariableDeclarator', 'init'],
  ],
};
