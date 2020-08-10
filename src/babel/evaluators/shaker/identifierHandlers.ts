import { types as t } from '@babel/core';
import type { Aliases, Identifier, Node, VisitorKeys } from '@babel/types';
import peek from '../../utils/peek';
import GraphBuilderState from './GraphBuilderState';
import type { IdentifierHandlerType, NodeType } from './types';
import { identifierHandlers as core } from './langs/core';
import ScopeManager from './scope';

type HandlerFn = <TParent extends Node = Node>(
  builder: GraphBuilderState,
  node: Identifier,
  parent: TParent,
  parentKey: VisitorKeys[TParent['type']],
  listIdx: number | null
) => void;

type Handler = IdentifierHandlerType | HandlerFn;

const handlers: {
  [key: string]: Handler;
} = {};

function isAlias(type: NodeType): type is keyof Aliases {
  return type in t.FLIPPED_ALIAS_KEYS;
}

export function defineHandler(
  typeOrAlias: NodeType,
  field: string,
  handler: Handler
) {
  const types = isAlias(typeOrAlias)
    ? t.FLIPPED_ALIAS_KEYS[typeOrAlias]
    : [typeOrAlias];
  types.forEach((type: string) => {
    handlers[`${type}:${field}`] = handler;
  });
}

export function batchDefineHandlers(
  typesAndFields: [NodeType, ...string[]][],
  handler: IdentifierHandlerType
) {
  typesAndFields.forEach(([type, ...fields]) =>
    fields.forEach((field) => defineHandler(type, field, handler))
  );
}

batchDefineHandlers([...core.declare], 'declare');

batchDefineHandlers([...core.keep], 'keep');

batchDefineHandlers([...core.refer], 'refer');

/*
 * Special case for FunctionDeclaration
 * Function id should be defined in the parent scope
 */
defineHandler(
  'FunctionDeclaration',
  'id',
  (builder: GraphBuilderState, node: Identifier) => {
    builder.scope.declare(node, false, null, 1);
  }
);

/*
 * Special handler for [obj.member = 42] = [1] in different contexts
 */
const memberExpressionObjectHandler = (
  builder: GraphBuilderState,
  node: Identifier
) => {
  const context = peek(builder.context);
  const declaration = builder.scope.addReference(node);
  if (declaration) {
    builder.graph.addEdge(node, declaration);

    if (context === 'lval') {
      // One exception here: we shake exports,
      // so `exports` does not depend on its members' assignments.
      if (
        declaration !== ScopeManager.globalExportsIdentifier &&
        declaration !== ScopeManager.globalModuleIdentifier
      ) {
        builder.graph.addEdge(declaration, node);
      }
    }
  }
};

defineHandler('MemberExpression', 'object', memberExpressionObjectHandler);
defineHandler(
  'OptionalMemberExpression',
  'object',
  memberExpressionObjectHandler
);

/*
 * Special handler for obj.member and obj[member]
 */
const memberExpressionPropertyHandler = (
  builder: GraphBuilderState,
  node: Identifier,
  parent: Node
) => {
  if (t.isMemberExpression(parent) && parent.computed) {
    const declaration = builder.scope.addReference(node);
    // Let's check that it's not a global variable
    if (declaration) {
      // usage of a variable depends on its declaration
      builder.graph.addEdge(node, declaration);

      const context = peek(builder.context);
      if (context === 'lval') {
        // This is an identifier in the left side of an assignment expression and a variable value depends on that.
        builder.graph.addEdge(declaration, node);
      }
    }
  }
};

defineHandler('MemberExpression', 'property', memberExpressionPropertyHandler);
defineHandler(
  'OptionalMemberExpression',
  'property',
  memberExpressionPropertyHandler
);

export default handlers;
