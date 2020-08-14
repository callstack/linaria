import { types as t } from '@babel/core';
import type { Identifier, Node } from '@babel/types';

type Scope = Map<string, Set<Identifier>>;

export type ScopeId = number | 'global';
export type DeclareHandler = (
  identifier: Identifier,
  from: Identifier | null
) => void;

const ResolvedNode = Symbol('ResolvedNode');
const functionScopes = new WeakSet<Scope>();

export class PromisedNode<T = Node> {
  static is<TNode>(obj: any): obj is PromisedNode<TNode> {
    return obj && ResolvedNode in obj;
  }

  [ResolvedNode]: T | undefined;

  get identifier(): T | undefined {
    return this[ResolvedNode];
  }
}

export const resolveNode = <T = Node>(
  obj: T | PromisedNode<T> | undefined
): T | undefined => (PromisedNode.is<T>(obj) ? obj.identifier : obj);

const scopeIds = new WeakMap<Scope, number | 'global'>();
const getId = (scope: Scope, identifier: Identifier): string =>
  `${scopeIds.get(scope)}:${identifier.name}`;

export default class ScopeManager {
  public static globalExportsIdentifier = t.identifier('exports');
  public static globalModuleIdentifier = t.identifier('module');
  private nextId = 0;
  private readonly stack: Array<Scope> = [];
  private readonly map: Map<ScopeId, Scope> = new Map();
  private readonly handlers: Map<ScopeId, Array<DeclareHandler>> = new Map();
  private readonly declarations: Map<
    string,
    Identifier | PromisedNode<Identifier>
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
    identifier: Identifier,
    isHoistable: boolean,
    from: Identifier | null = null,
    stack = 0
  ): void {
    const idName = identifier.name;
    const scope = this.stack
      .slice(stack)
      .find((s) => !isHoistable || functionScopes.has(s))!;
    if (this.global.has(idName)) {
      // It's probably a declaration of a previous referenced identifier
      // Let's use naïve implementation of hoisting
      const promise = this.declarations.get(
        getId(this.global, identifier)
      )! as PromisedNode<Identifier>;
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

  addReference(identifier: Identifier): Identifier | PromisedNode {
    const name = identifier.name;
    const scope = this.stack.find((s) => s.has(name)) || this.global;
    const id = getId(scope, identifier);
    if (scope === this.global && !scope.has(name)) {
      scope.set(name, new Set());
      this.declarations.set(getId(scope, identifier), new PromisedNode());
    }

    scope.get(name)!.add(identifier);
    return this.declarations.get(id)!;
  }

  whereIsDeclared(identifier: Identifier): ScopeId | undefined {
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
    identifierOrName: Identifier | string
  ): Identifier | undefined {
    let name: string;
    if (typeof identifierOrName === 'string') {
      name = identifierOrName;
    } else {
      const scopeId = this.whereIsDeclared(identifierOrName);
      if (scopeId === undefined) {
        return undefined;
      }

      name = getId(this.map.get(scopeId)!, identifierOrName);
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
