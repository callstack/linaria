/* @flow */

export type NodePath<K> = {
  node: K,
  parent: Object,
  parentPath: NodePath<*>,
  scope: {
    getBinding: (id: string) => Binding<any>,
  },
  traverse: (visitor: { [key: string]: Function }, thisArgs?: any) => void,
  findParent: ((path: NodePath<*>) => boolean) => NodePath<*>,
  isProgram: () => boolean,
  isReferenced: () => boolean,
  getSource: () => string,
  isVariableDeclarator: () => boolean,
};

export type Binding<K> = {
  kind: string,
  path: NodePath<K>,
};

export type BabelObjectExpression = {
  properties: any[],
  type: string,
};

export type BabelObjectPattern = {
  properties: Object[],
  type: string,
};

export type BabelTaggedTemplateElement = {
  value: {
    raw: string,
    cooked: string,
  },
};

export type BabelTaggedTemplateExpression<T> = {
  tag: T,
  quasi: {
    expressions: Object[],
    quasis: BabelTaggedTemplateElement[],
  },
  type: string,
};

export type BabelIdentifier = {
  name: string,
  type: string,
};

export type BabelMemberExpression = {
  object: BabelIdentifier,
  property: BabelIdentifier,
  type: string,
};

export type BabelCallExpression = {
  callee: BabelIdentifier,
  arguments: BabelStringLiteral[] | BabelIdentifier[],
  type: string,
};

export type BabelVariableDeclarator<T> = {
  id: BabelIdentifier | Object,
  init: T,
  type: string,
};

export type BabelVariableDeclaration = {
  declarations: BabelVariableDeclarator<any>[],
  kind: 'var' | 'let' | 'const',
  type: string,
};

export type BabelStringLiteral = {
  value: string,
  type: string,
};

export type BabelIsTypeFunction<T> = (value: T | Object) => boolean;
export type BabelNodeFactory<T> = (...args: mixed[]) => T;

export type BabelTypes = {
  templateElement: BabelNodeFactory<BabelTaggedTemplateElement>,
  callExpression: BabelNodeFactory<BabelCallExpression>,
  identifier: BabelNodeFactory<BabelIdentifier>,
  stringLiteral: BabelNodeFactory<BabelStringLiteral>,
  memberExpression: BabelNodeFactory<BabelMemberExpression>,
  expressionStatement: BabelNodeFactory<any>,
  isTaggedTemplateExpression: BabelIsTypeFunction<
    BabelTaggedTemplateExpression<any>
  >,
  isCallExpression: BabelIsTypeFunction<BabelCallExpression>,
  isMemberExpression: BabelIsTypeFunction<BabelMemberExpression>,
  isIdentifier: BabelIsTypeFunction<BabelIdentifier>,
  isVariableDeclaration: BabelIsTypeFunction<BabelVariableDeclaration>,
  isObjectExpression: BabelIsTypeFunction<BabelObjectExpression>,
  isObjectPattern: BabelIsTypeFunction<BabelObjectPattern>,
};

export type ImportStatement = {
  name: string,
  isEsm: boolean,
  isDefault: boolean,
  isEsmInterop?: boolean,
  sourceFile?: string,
  sourceFrom?: string,
};

export type State = {
  filename: string,
  skipFile: boolean,
  foundLinariaTaggedLiterals: boolean,
  file: Object,
  opts: Object,
};
