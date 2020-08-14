import { types as t } from '@babel/core';
import type { Identifier, Node } from '@babel/types';
import ScopeManager, { PromisedNode, resolveNode } from './scope';

type Action = (this: DepsGraph, a: Node, b: Node) => void;

function addEdge(this: DepsGraph, a: Node, b: Node) {
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
  public readonly imports: Map<string, Identifier[]> = new Map();
  public readonly importAliases: Map<Identifier, string> = new Map();
  public readonly importTypes: Map<string, 'wildcard' | 'default'> = new Map();

  protected readonly edges: Array<[Node, Node]> = [];
  protected readonly exports: Map<string, Node> = new Map();
  protected readonly dependencies: Map<Node, Set<Node>> = new Map();
  protected readonly dependents: Map<Node, Set<Node>> = new Map();

  private actionQueue: Array<
    [Action, Node | PromisedNode, Node | PromisedNode]
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

  private getAllReferences(id: string): Identifier[] {
    const [, name] = id.split(':');
    const declaration = this.scope.getDeclaration(id)!;
    const allReferences = [
      ...Array.from(this.dependencies.get(declaration) || []),
      ...Array.from(this.dependents.get(declaration) || []),
    ].filter((i) => t.isIdentifier(i) && i.name === name) as Identifier[];
    allReferences.push(declaration);
    return allReferences;
  }

  constructor(protected scope: ScopeManager) {}

  addEdge(dependent: Node | PromisedNode, dependency: Node | PromisedNode) {
    this.actionQueue.push([addEdge, dependent, dependency]);
  }

  addExport(name: string, node: Node) {
    this.exports.set(name, node);
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

  getDependencies(nodes: Node[]) {
    this.processQueue();
    return nodes.reduce(
      (acc, node) => acc.concat(Array.from(this.dependencies.get(node) || [])),
      [] as Node[]
    );
  }

  getLeafs(only: string[] | null): Array<Node | undefined> {
    this.processQueue();
    return only
      ? only.map((name) => this.exports.get(name))
      : Array.from(this.exports.values());
  }
}
