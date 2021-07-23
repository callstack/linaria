import { types as t } from '@babel/core';
import ScopeManager, { PromisedNode, resolveNode } from './scope';

type Action = (this: DepsGraph, a: t.Node, b: t.Node) => void;

function addEdge(this: DepsGraph, a: t.Node, b: t.Node) {
  if (this.dependencies.has(a) && this.dependencies.get(a)!.has(b)) {
    // edge has been already added∂ƒ
    return;
  }

  this.edges.push([a, b]);
  if (this.dependencies.has(a)) {
    this.dependencies.get(a)!.add(b);
  } else {
    this.dependencies.set(a, new Set([b]));
  }

  if (this.dependents.has(b)) {
    this.dependents.get(b)!.add(a);
  } else {
    this.dependents.set(b, new Set([a]));
  }
}

export default class DepsGraph {
  public readonly imports: Map<string, t.Identifier[]> = new Map();
  public readonly importAliases: Map<t.Identifier, string> = new Map();
  public readonly importTypes: Map<
    string,
    'wildcard' | 'default' | 'reexport'
  > = new Map();
  public readonly reexports: Array<t.Identifier> = [];

  protected readonly parents: WeakMap<t.Node, t.Node> = new WeakMap();
  protected readonly edges: Array<[t.Node, t.Node]> = [];
  protected readonly exports: Map<string, t.Node> = new Map();
  protected readonly dependencies: Map<t.Node, Set<t.Node>> = new Map();
  protected readonly dependents: Map<t.Node, Set<t.Node>> = new Map();

  private actionQueue: Array<
    [Action, t.Node | PromisedNode, t.Node | PromisedNode]
  > = [];

  private processQueue() {
    if (this.actionQueue.length === 0) {
      return;
    }

    for (const [action, a, b] of this.actionQueue) {
      const resolvedA = resolveNode(a);
      const resolvedB = resolveNode(b);
      if (resolvedA && resolvedB) {
        action.call(this, resolvedA, resolvedB);
      }
    }

    this.actionQueue = [];
  }

  private getAllReferences(id: string): (t.Identifier | t.MemberExpression)[] {
    const [, name] = id.split(':');
    const declaration = this.scope.getDeclaration(id)!;
    const allReferences: (t.Identifier | t.MemberExpression)[] = [
      ...Array.from(this.dependencies.get(declaration) || []),
      ...Array.from(this.dependents.get(declaration) || []),
    ].filter((i) => t.isIdentifier(i) && i.name === name) as t.Identifier[];
    allReferences.push(declaration);
    return allReferences;
  }

  constructor(protected scope: ScopeManager) {}

  addEdge(dependent: t.Node | PromisedNode, dependency: t.Node | PromisedNode) {
    this.actionQueue.push([addEdge, dependent, dependency]);
  }

  addExport(name: string, node: t.Node) {
    this.exports.set(name, node);
  }

  addParent(node: t.Node, parent: t.Node) {
    this.parents.set(node, parent);
  }

  getParent(node: t.Node): t.Node | undefined {
    return this.parents.get(node);
  }

  getDependenciesByBinding(id: string) {
    this.processQueue();
    const allReferences = this.getAllReferences(id);
    const dependencies = [];
    for (let [a, b] of this.edges) {
      if (t.isIdentifier(a) && allReferences.includes(a)) {
        dependencies.push(b);
      }
    }

    return dependencies;
  }

  getDependentsByBinding(id: string) {
    this.processQueue();
    const allReferences = this.getAllReferences(id);
    const dependents = [];
    for (let [a, b] of this.edges) {
      if (t.isIdentifier(b) && allReferences.includes(b)) {
        dependents.push(a);
      }
    }

    return dependents;
  }

  findDependencies(like: Object) {
    this.processQueue();
    return this.edges
      .filter(([a]) => t.shallowEqual(a, like))
      .map(([, b]) => b);
  }

  findDependents(like: object) {
    this.processQueue();
    return this.edges
      .filter(([, b]) => t.shallowEqual(b, like))
      .map(([a]) => a);
  }

  getDependencies(nodes: t.Node[]) {
    this.processQueue();
    return nodes.reduce(
      (acc, node) => acc.concat(Array.from(this.dependencies.get(node) || [])),
      [] as t.Node[]
    );
  }

  getLeaf(name: string): t.Node | undefined {
    return this.exports.get(name);
  }

  getLeaves(only: string[] | null): Array<t.Node | undefined> {
    this.processQueue();
    return only
      ? only.map((name) => this.getLeaf(name))
      : Array.from(this.exports.values());
  }
}
