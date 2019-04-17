import { types as t } from '@babel/core';
import ScopeManager from './scope';

export type ExternalDep = {
  source: string;
  local: t.Identifier;
  imported: t.Identifier | null;
};

export default class DepsGraph {
  public readonly externalDeps: ExternalDep[] = [];

  private readonly edges: Array<[t.Node, t.Node]> = [];
  private readonly dependencies: Map<t.Node, t.Node[]> = new Map();
  private readonly dependents: Map<t.Node, t.Node[]> = new Map();
  private readonly bindingsDependencies: Map<string, t.Node[]> = new Map();
  private readonly bindingsDependents: Map<string, t.Node[]> = new Map();

  constructor(private scope: ScopeManager) {}

  addEdge(a: t.Node, b: t.Node) {
    this.edges.push([a, b]);
    if (!this.dependencies.has(a)) {
      this.dependencies.set(a, []);
    }

    if (!this.dependents.has(b)) {
      this.dependents.set(b, []);
    }

    this.dependencies.get(a)!.push(b);
    this.dependents.get(b)!.push(a);

    if (t.isIdentifier(a)) {
      const scopeId = this.scope.whereIsDeclared(a);
      if (scopeId !== undefined) {
        const key = `${scopeId}:${a.name}`;
        if (!this.bindingsDependencies.has(key)) {
          this.bindingsDependencies.set(key, []);
        }

        this.bindingsDependencies.get(key)!.push(b);
      }
    }

    if (t.isIdentifier(b)) {
      const scopeId = this.scope.whereIsDeclared(b);
      if (scopeId !== undefined) {
        const key = `${scopeId}:${b.name}`;
        if (!this.bindingsDependents.has(key)) {
          this.bindingsDependents.set(key, []);
        }

        this.bindingsDependents.get(key)!.push(a);
      }
    }
  }

  getDependenciesByBinding(id: string) {
    return this.bindingsDependencies.get(id) || [];
  }

  getDependentsByBinding(id: string) {
    return this.bindingsDependents.get(id) || [];
  }

  findDependencies(like: Object) {
    return this.edges
      .filter(([a]) => t.shallowEqual(a, like))
      .map(([, b]) => b);
  }

  findDependents(like: object) {
    return this.edges
      .filter(([, b]) => t.shallowEqual(b, like))
      .map(([a]) => a);
  }

  getDependencies(nodes: t.Node[]) {
    return nodes.reduce(
      (acc, node) => acc.concat(this.dependencies.get(node) || []),
      [] as t.Node[]
    );
  }

  getDependents(nodes: t.Node[]) {
    return nodes.reduce(
      (acc, node) => acc.concat(this.dependents.get(node) || []),
      [] as t.Node[]
    );
  }

  getLeafs(required: Array<t.Expression | string>): t.Expression[] {
    return required
      .map(node =>
        typeof node === 'string' ? this.scope.getDeclaration(`0:${node}`) : node
      )
      .filter(n => n) as t.Expression[];
  }

  isDeclared(name: string) {
    return this.scope.isDeclared(`0:${name}`);
  }
}
