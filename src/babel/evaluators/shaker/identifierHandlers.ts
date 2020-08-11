import type { Aliases, Identifier, Node, VisitorKeys } from '@babel/types';
import peek from '../../utils/peek';
import { Core } from '../../babel';
import GraphBuilderState from './GraphBuilderState';
import type { IdentifierHandlerType, NodeType } from './types';
import { identifierHandlers as core } from './langs/core';

type HandlerFn = <TParent extends Node = Node>(
  babel: Core,
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

function isAlias({ types: t }: Core, type: NodeType): type is keyof Aliases {
  return type in t.FLIPPED_ALIAS_KEYS;
}

function defineHandler(
  babel: Core,
  typeOrAlias: NodeType,
  field: string,
  handler: Handler
) {
  const types = isAlias(babel, typeOrAlias)
    ? babel.types.FLIPPED_ALIAS_KEYS[typeOrAlias]
    : [typeOrAlias];
  types.forEach((type: string) => {
    handlers[`${type}:${field}`] = handler;
  });
}

function batchDefineHandlers(
  babel: Core,
  typesAndFields: [NodeType, ...string[]][],
  handler: IdentifierHandlerType
) {
  typesAndFields.forEach(([type, ...fields]) =>
    fields.forEach((field) => defineHandler(babel, type, field, handler))
  );
}

export function initialize(babel: Core) {
  if (Object.keys(handlers).length > 0) return;

  batchDefineHandlers(babel, [...core.declare], 'declare');

  batchDefineHandlers(babel, [...core.keep], 'keep');

  batchDefineHandlers(babel, [...core.refer], 'refer');

  /*
   * Special case for FunctionDeclaration
   * Function id should be defined in the parent scope
   */
  defineHandler(babel, 'FunctionDeclaration', 'id', (babel, builder, node) => {
    builder.scope.declare(node, false, null, 1);
  });

  /*
   * Special handler for [obj.member = 42] = [1] in different contexts
   */
  const memberExpressionObjectHandler = (
    babel: Core,
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
          declaration !== builder.scope.globalExportsIdentifier &&
          declaration !== builder.scope.globalModuleIdentifier
        ) {
          builder.graph.addEdge(declaration, node);
        }
      }
    }
  };

  defineHandler(
    babel,
    'MemberExpression',
    'object',
    memberExpressionObjectHandler
  );
  defineHandler(
    babel,
    'OptionalMemberExpression',
    'object',
    memberExpressionObjectHandler
  );

  /*
   * Special handler for obj.member and obj[member]
   */
  const memberExpressionPropertyHandler = (
    { types: t }: Core,
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

  defineHandler(
    babel,
    'MemberExpression',
    'property',
    memberExpressionPropertyHandler
  );
  defineHandler(
    babel,
    'OptionalMemberExpression',
    'property',
    memberExpressionPropertyHandler
  );
}

export default handlers;
