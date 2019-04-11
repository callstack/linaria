import { types } from '@babel/core';

type Identifier = types.Identifier;
type Scope = Map<string, Set<Identifier>>;

export type ScopeId = number | 'global';
export type DeclareHandler = (identifier: Identifier) => void;

const scopeIds = new WeakMap<Scope, number | 'global'>();
const getId = (scope: Scope, identifier: Identifier): string =>
  `${scopeIds.get(scope)}:${identifier.name}`;

export default class ScopeManager {
  private _nextId = 0;
  private readonly _stack: Array<Scope> = [];
  private readonly _map: Map<ScopeId, Scope> = new Map();
  private readonly _handlers: Map<ScopeId, Array<DeclareHandler>> = new Map();
  private readonly declarations: Map<string, Identifier> = new Map();

  private get global(): Scope {
    return this._map.get('global')!;
  }

  constructor() {
    this.new('global');
  }

  new(scopeId: ScopeId = this._nextId++): Scope {
    const scope: Scope = new Map();
    scopeIds.set(scope, scopeId);
    this._map.set(scopeId, scope);
    this._handlers.set(scopeId, []);
    this._stack.unshift(scope);
    return scope;
  }

  dispose(): Scope | undefined {
    const disposed = this._stack.shift();
    if (disposed) {
      this._map.delete(scopeIds.get(disposed)!);
    }

    return disposed;
  }

  declare(identifier: Identifier): void {
    const scope = this._stack[0];
    scope.set(identifier.name, new Set([identifier]));
    this.declarations.set(getId(scope, identifier), identifier);
    const handlers = this._handlers.get(scopeIds.get(scope)!)!;
    handlers.forEach(handler => handler(identifier));
  }

  addReference(identifier: Identifier): Identifier | undefined {
    const name = identifier.name;
    const scope = this._stack.find(s => s.has(name)) || this.global;
    const id = getId(scope, identifier);
    if (scope === this.global && !scope.has(name)) {
      scope.set(name, new Set());
    }

    scope.get(name)!.add(identifier);
    return this.declarations.get(id);
  }

  whereIsDeclared(identifier: Identifier): ScopeId | undefined {
    const name = identifier.name;
    const scope = this._stack.find(
      s => s.has(name) && s.get(name)!.has(identifier)
    );
    if (scope) return scopeIds.get(scope);
    if (this.global.has(name)) return 'global';
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
      if (scopeId === undefined || scopeId === 'global') return undefined;
      name = getId(this._map.get(scopeId)!, identifierOrName);
    }

    return this.declarations.get(name);
  }

  addDeclareHandler(handler: DeclareHandler): () => void {
    const scopeId = scopeIds.get(this._stack[0])!;
    this._handlers.get(scopeId)!.push(handler);
    return () => {
      const handlers = this._handlers.get(scopeId)!.filter(h => h !== handler);
      this._handlers.set(scopeId, handlers);
    };
  }
}
