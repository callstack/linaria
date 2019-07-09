import { types as t } from '@babel/core';

import { IdentifierHandlers, Visitors } from '../types';
import GraphBuilderState from '../GraphBuilderState';
import * as helpers from '../visitorHelpers';

export const visitors: Visitors = {
  TSAsExpression: helpers.replace<t.TSAsExpression>('expression'),

  TSEnumDeclaration(this: GraphBuilderState, node: t.TSEnumDeclaration) {
    this.baseVisit(node);

    node.members.forEach(member => {
      this.graph.addEdge(node.id, member);
      this.graph.addEdge(node, member);
    });

    this.graph.addEdge(node.id, node);
  },

  TSEnumMember(this: GraphBuilderState, node: t.TSEnumMember) {
    this.baseVisit(node);

    this.graph.addEdge(node, node.id);
    if (node.initializer) {
      this.graph.addEdge(node, node.initializer);
    }
  },

  TSTypeAnnotation: helpers.ignore(),
  TSTypeParameterDeclaration: helpers.ignore(),
};

export const identifierHandlers: IdentifierHandlers = {
  declare: [['TSEnumDeclaration', 'id']],
  refer: [],
  keep: [['TSEnumMember', 'id']],
};
