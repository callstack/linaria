import { types as t } from '@babel/core';
import GraphBuilderState from './GraphBuilderState';
import peek from '../utils/peek';

type HandlerFn = <TParent extends t.Node = t.Node>(
  builder: GraphBuilderState,
  node: t.Identifier,
  parent: TParent,
  parentKey: t.VisitorKeys[TParent['type']],
  listIdx: number | null
) => void;

type Handler = 'declare' | 'keep' | 'refer' | HandlerFn;

type NodeType = t.Node['type'] | keyof t.Aliases;

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
  handler: Handler
) {
  typesAndFields.forEach(([type, field]) =>
    defineHandler(type, field, handler)
  );
}

batchDefineHandlers(
  [
    ['ArrayPattern', 'elements'],
    ['AssignmentPattern', 'left'],
    ['Function', 'params'],
    ['ImportDefaultSpecifier', 'local'],
    ['ImportSpecifier', 'local'],
    ['RestElement', 'argument'],
    ['VariableDeclarator', 'id'],
  ],
  'declare'
);

batchDefineHandlers(
  [
    ['ExportSpecifier', 'exported'],
    ['ImportSpecifier', 'imported'],
    ['MemberExpression', 'property'],
    ['ObjectProperty', 'key'],
  ],
  'keep'
);

batchDefineHandlers(
  [
    ['AssignmentExpression', 'left'],
    ['AssignmentExpression', 'right'],
    ['AssignmentPattern', 'right'],
    ['BinaryExpression', 'left'],
    ['BinaryExpression', 'right'],
    ['CallExpression', 'arguments'],
    ['CallExpression', 'callee'],
    ['ExportDefaultDeclaration', 'declaration'],
    ['ExportSpecifier', 'local'],
    ['Function', 'body'],
    ['LogicalExpression', 'left'],
    ['LogicalExpression', 'right'],
    ['MemberExpression', 'property'],
    ['MemberExpression', 'object'],
    ['NewExpression', 'callee'],
    ['ReturnStatement', 'argument'],
    ['SequenceExpression', 'expressions'],
    ['SpreadElement', 'argument'],
    ['TaggedTemplateExpression', 'tag'],
    ['TemplateLiteral', 'expressions'],
    ['VariableDeclarator', 'init'],
  ],
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
