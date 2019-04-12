import { types } from '@babel/core';

type Identifier = types.Identifier;
type Scope = Map<string, Set<Identifier>>;

export type ScopeId = number | 'global';
export type DeclareHandler = (identifier: Identifier) => void;

const scopeIds = new WeakMap<Scope, number | 'global'>();
const getId = (scope: Scope, identifier: Identifier): string =>
  `${scopeIds.get(scope)}:${identifier.name}`;

export default class ScopeManager {
  private nextId = 0;
  private readonly stack: Array<Scope> = [];
  private readonly map: Map<ScopeId, Scope> = new Map();
  private readonly handlers: Map<ScopeId, Array<DeclareHandler>> = new Map();
  private readonly declarations: Map<string, Identifier> = new Map();

  private get global(): Scope {
    return this.map.get('global')!;
  }

  constructor() {
    this.new('global');
  }

  new(scopeId: ScopeId = this.nextId++): Scope {
    const scope: Scope = new Map();
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

  declare(identifier: Identifier): void {
    const scope = this.stack[0];
    scope.set(identifier.name, new Set([identifier]));
    this.declarations.set(getId(scope, identifier), identifier);
    const handlers = this.handlers.get(scopeIds.get(scope)!)!;
    handlers.forEach(handler => handler(identifier));
  }

  addReference(identifier: Identifier): Identifier | undefined {
    const name = identifier.name;
    const scope = this.stack.find(s => s.has(name)) || this.global;
    const id = getId(scope, identifier);
    if (scope === this.global && !scope.has(name)) {
      scope.set(name, new Set());
    }

    scope.get(name)!.add(identifier);
    return this.declarations.get(id);
  }

  whereIsDeclared(identifier: Identifier): ScopeId | undefined {
    const name = identifier.name;
    const scope = this.stack.find(
      s => s.has(name) && s.get(name)!.has(identifier)
    );
    if (scope) {
      return scopeIds.get(scope);
    }

    if (this.global.has(name)) {
      return 'global';
    }

    return undefined;
  }

  isDeclared(name: string): boolean {
    return this.declarations.has(name);
  }

  getDeclaration(
    identifierOrName: Identifier | string
  ): Identifier | undefined {
    let name: string;
    if (typeof identifierOrName === 'string') {
      name = identifierOrName;
    } else {
      const scopeId = this.whereIsDeclared(identifierOrName);
      if (scopeId === undefined || scopeId === 'global') {
        return undefined;
      }

      name = getId(this.map.get(scopeId)!, identifierOrName);
    }

    return this.declarations.get(name);
  }

  addDeclareHandler(handler: DeclareHandler): () => void {
    const scopeId = scopeIds.get(this.stack[0])!;
    this.handlers.get(scopeId)!.push(handler);
    return () => {
      const handlers = this.handlers.get(scopeId)!.filter(h => h !== handler);
      this.handlers.set(scopeId, handlers);
    };
  }
}
