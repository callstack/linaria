import { types as t } from '@babel/core';
import GraphBuilderState from './GraphBuilderState';
import peek from '../utils/peek';
import { IdentifierHandlerType, NodeType } from './types';
import { identifierHandlers as core } from './langs/core';
import { identifierHandlers as es2015 } from './langs/es2015';
import { identifierHandlers as typescript } from './langs/typescript';

type HandlerFn = <TParent extends t.Node = t.Node>(
  builder: GraphBuilderState,
  node: t.Identifier,
  parent: TParent,
  parentKey: t.VisitorKeys[TParent['type']],
  listIdx: number | null
) => void;

type Handler = IdentifierHandlerType | HandlerFn;

const handlers: {
  [key: string]: Handler;
} = {};

function isAlias(type: NodeType): type is keyof t.Aliases {
  return type in t.FLIPPED_ALIAS_KEYS;
}

export function defineHandler<T extends NodeType>(
  typeOrAlias: T,
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
  typesAndFields: [NodeType, string][],
  handler: IdentifierHandlerType
) {
  typesAndFields.forEach(([type, field]) =>
    defineHandler(type, field, handler)
  );
}

batchDefineHandlers(
  [...core.declare, ...es2015.declare, ...typescript.declare],
  'declare'
);

batchDefineHandlers([...core.keep, ...es2015.keep, ...typescript.keep], 'keep');

batchDefineHandlers(
  [...core.refer, ...es2015.refer, ...typescript.refer],
  'refer'
);

/*
 * Special handler for { foo: bar } in different contexts
 */
defineHandler(
  'ObjectProperty',
  'value',
  (builder: GraphBuilderState, node: t.Identifier) => {
    const context = peek(builder.context);
    if (context === 'pattern') {
      builder.scope.declare(node);
    } else {
      const declaration = builder.scope.addReference(node);
      if (declaration) {
        builder.graph.addEdge(node, declaration);
      }
    }
  }
);

export default handlers;
