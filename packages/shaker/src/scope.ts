import { types as t } from '@babel/core';
import invariant from 'ts-invariant';

type Scope = Map<string, Set<t.Identifier | t.MemberExpression>>;

export type ScopeId = number | 'global' | 'exports';
export type DeclareHandler = (
  identifier: t.Identifier,
  from: t.Identifier | null
) => void;

const ResolvedNode = Symbol('ResolvedNode');
const functionScopes = new WeakSet<Scope>();

export class PromisedNode<T = t.Node> {
  static is<TNode>(obj: any): obj is PromisedNode<TNode> {
    return obj && ResolvedNode in obj;
  }

  [ResolvedNode]: T | undefined;

  get identifier(): T | undefined {
    return this[ResolvedNode];
  }
}

export const resolveNode = <T = t.Node>(
  obj: T | PromisedNode<T> | undefined
): T | undefined => (PromisedNode.is<T>(obj) ? obj.identifier : obj);

const getExportName = (node: t.Node): string => {
  invariant(
    t.isMemberExpression(node),
    `getExportName expects MemberExpression but received ${node.type}`
  );

  const { object, property } = node;
  invariant(
    t.isIdentifier(object) && object.name === 'exports',
    `getExportName expects a member expression with 'exports'`
  );
  invariant(
    t.isIdentifier(property) || t.isStringLiteral(property),
    `getExportName supports only identifiers and literals as names of exported values`
  );

  const name = t.isIdentifier(property) ? property.name : property.value;
  return `exports.${name}`;
};

const scopeIds = new WeakMap<Scope, ScopeId>();
const getId = (scope: Scope, identifier: t.Identifier | string): string => {
  const scopeId = scopeIds.get(scope);
  return `${scopeId}:${
    typeof identifier === 'string' ? identifier : identifier.name
  }`;
};

export default class ScopeManager {
  public static globalExportsIdentifier = t.identifier('exports');
  public static globalModuleIdentifier = t.identifier('module');
  private nextId = 0;
  private readonly stack: Array<Scope> = [];
  private readonly map: Map<ScopeId, Scope> = new Map();
  private readonly handlers: Map<ScopeId, Array<DeclareHandler>> = new Map();
  private readonly declarations: Map<
    string,
    t.Identifier | t.MemberExpression | PromisedNode<t.Identifier>
  > = new Map();

  private get global(): Scope {
    return this.map.get('global')!;
  }

  constructor() {
    this.new(true, 'global');
    this.declare(ScopeManager.globalExportsIdentifier, false);
    this.declare(ScopeManager.globalModuleIdentifier, false);
  }

  new(isFunction: boolean, scopeId: ScopeId = this.nextId++): Scope {
    const scope: Scope = new Map();
    if (isFunction) {
      functionScopes.add(scope);
    }

    scopeIds.set(scope, scopeId);
    this.map.set(scopeId, scope);
    this.handlers.set(scopeId, []);
    this.stack.unshift(scope);
    return scope;
  }

  dispose(): Scope | undefined {
    const disposed = this.stack.shift();
    if (disposed) {
      this.map.delete(scopeIds.get(disposed)!);
    }

    return disposed;
  }

  declare(
    identifierOrMemberExpression: t.Identifier | t.MemberExpression,
    isHoistable: boolean,
    from: t.Identifier | null = null,
    stack = 0
  ): void {
    if (t.isMemberExpression(identifierOrMemberExpression)) {
      // declare receives MemberExpression only if it's `exports.something` expression
      const memberExp = identifierOrMemberExpression;
      const name = getExportName(memberExp);
      if (!this.global.has(name)) {
        this.global.set(name, new Set());
      }

      // There can be a few `export.foo = …` statements, but we need only the last one
      this.declarations.set(getId(this.global, name), memberExp);
      this.global.get(name)!.add(memberExp);
      return;
    }

    const identifier = identifierOrMemberExpression;
    const idName = identifier.name;
    const scope = this.stack
      .slice(stack)
      .find((s) => !isHoistable || functionScopes.has(s))!;
    if (this.global.has(idName)) {
      // It's probably a declaration of a previous referenced identifier
      // Let's use naïve implementation of hoisting
      const promise = this.declarations.get(
        getId(this.global, identifier)
      )! as PromisedNode<t.Identifier>;
      promise[ResolvedNode] = identifier;
      scope.set(
        idName,
        new Set([identifier, ...Array.from(this.global.get(idName)!)])
      );
      this.global.delete(idName);
    } else {
      scope.set(idName, new Set([identifier]));
    }

    this.declarations.set(getId(scope, identifier), identifier);
    const handlers = this.handlers.get(scopeIds.get(scope)!)!;
    handlers.forEach((handler) => handler(identifier, from));
  }

  addReference(
    identifierOrMemberExpression: t.Identifier | t.MemberExpression
  ): t.Identifier | t.MemberExpression | PromisedNode {
    const name = t.isIdentifier(identifierOrMemberExpression)
      ? identifierOrMemberExpression.name
      : getExportName(identifierOrMemberExpression);
    const scope = this.stack.find((s) => s.has(name)) ?? this.global;
    const id = getId(scope, name);
    if (scope === this.global && !scope.has(name)) {
      scope.set(name, new Set());
      this.declarations.set(id, new PromisedNode());
    }

    scope.get(name)!.add(identifierOrMemberExpression);
    return this.declarations.get(id)!;
  }

  whereIsDeclared(identifier: t.Identifier): ScopeId | undefined {
    const name = identifier.name;
    const scope = this.stack.find(
      (s) => s.has(name) && s.get(name)!.has(identifier)
    );
    if (scope) {
      return scopeIds.get(scope);
    }

    if (this.global.has(name)) {
      return 'global';
    }

    return undefined;
  }

  getDeclaration(
    identifierOrMemberExpOrName: t.Identifier | t.MemberExpression | string
  ): t.Identifier | t.MemberExpression | undefined {
    let name: string;
    if (typeof identifierOrMemberExpOrName === 'string') {
      name = identifierOrMemberExpOrName;
    } else if (t.isMemberExpression(identifierOrMemberExpOrName)) {
      name = getId(this.global, getExportName(identifierOrMemberExpOrName));
    } else {
      const scopeId = this.whereIsDeclared(identifierOrMemberExpOrName);
      if (scopeId === undefined) {
        return undefined;
      }

      name = getId(this.map.get(scopeId)!, identifierOrMemberExpOrName);
    }

    return resolveNode(this.declarations.get(name));
  }

  addDeclareHandler(handler: DeclareHandler): () => void {
    const scopeId = scopeIds.get(this.stack[0])!;
    this.handlers.get(scopeId)!.push(handler);
    return () => {
      const handlers = this.handlers.get(scopeId)!.filter((h) => h !== handler);
      this.handlers.set(scopeId, handlers);
    };
  }
}
