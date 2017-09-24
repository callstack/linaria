/* @flow */

export type NodePath<K> = {
  node: K & {
    loc: {
      start: { line: number, column: number },
    },
  },
  parent: Object,
  parentPath: NodePath<*>,
  scope: {
    getBinding: (id: string) => Binding<any>,
    generateUidIdentifier: (id: string) => BabelIdentifier,
  },
  isProgram: () => boolean,
  isReferenced: () => boolean,
  isVariableDeclarator: () => boolean,
  isImportDefaultSpecifier: () => boolean,
  isImportSpecifier: () => boolean,
  isVariableDeclaration: () => boolean,
  getSource: () => string,
  buildCodeFrameError: (message: string) => Error,
  traverse: (visitor: { [key: string]: Function }, thisArgs?: any) => void,
  findParent: ((path: NodePath<*>) => boolean) => NodePath<*>,
};

export type Binding<K> = {
  kind: string,
  path: NodePath<K>,
};

export type BabelCore = {
  types: BabelTypes,
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

export type BabelJSXExpressionContainer = {
  type: string,
  expression: any,
};

export type BabelJSXIdentifier = {
  name: string,
  type: string,
};

export type BabelJSXSpreadAttribute = {
  attr: {
    argument: any,
  },
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
  variableDeclaration: BabelNodeFactory<BabelVariableDeclaration>,
  variableDeclarator: BabelNodeFactory<BabelVariableDeclarator<any>>,
  program: BabelNodeFactory<any>,
  isTaggedTemplateExpression: BabelIsTypeFunction<
    BabelTaggedTemplateExpression<any>
  >,
  isCallExpression: BabelIsTypeFunction<BabelCallExpression>,
  isIdentifier: BabelIsTypeFunction<BabelIdentifier>,
  isJSXExpressionContainer: BabelIsTypeFunction<BabelJSXExpressionContainer>,
  isJSXIdentifier: BabelIsTypeFunction<BabelJSXIdentifier>,
  isJSXSpreadAttribute: BabelIsTypeFunction<BabelJSXSpreadAttribute>,
  isMemberExpression: BabelIsTypeFunction<BabelMemberExpression>,
  isObjectExpression: BabelIsTypeFunction<BabelObjectExpression>,
  isObjectPattern: BabelIsTypeFunction<BabelObjectPattern>,
  isVariableDeclaration: BabelIsTypeFunction<BabelVariableDeclaration>,
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

export type RequirementSource = {
  code: string,
  loc: { line: number, column: number },
};
