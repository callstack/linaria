import { types as t } from '@babel/core';

import { IdentifierHandlers, Visitors } from '../types';
import GraphBuilderState from '../GraphBuilderState';
import * as helpers from '../visitorHelpers';

export const visitors: Visitors = {
  AssignmentPattern(this: GraphBuilderState, node: t.AssignmentPattern) {
    this.baseVisit(node);
    if (t.isIdentifier(node.left)) {
      this.graph.addEdge(node.left, node.right);
    } else if (t.isMemberExpression(node.left)) {
      this.graph.addEdge(node.left.property, node.right);
    }
  },

  ExportNamedDeclaration: helpers.replace<t.ExportNamedDeclaration>(
    'declaration'
  ),

  ImportDeclaration(this: GraphBuilderState, node: t.ImportDeclaration) {
    this.baseVisit(node);
    this.graph.addEdge(node, node.source);
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
};

export const identifierHandlers: IdentifierHandlers = {
  declare: [
    ['ArrayPattern', 'elements'],
    ['AssignmentPattern', 'left'],
    ['ImportDefaultSpecifier', 'local'],
    ['ImportSpecifier', 'local'],
  ],
  keep: [['ExportSpecifier', 'exported'], ['ImportSpecifier', 'imported']],
  refer: [
    ['AssignmentPattern', 'right'],
    ['ExportDefaultDeclaration', 'declaration'],
    ['ExportSpecifier', 'local'],
    ['SpreadElement', 'argument'],
    ['TaggedTemplateExpression', 'tag'],
    ['TemplateLiteral', 'expressions'],
  ],
};
