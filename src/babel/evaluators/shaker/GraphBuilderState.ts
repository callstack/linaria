import { types as t } from '@babel/core';
import ScopeManager from './scope';
import DepsGraph from './DepsGraph';

export type OnVisitCallback = (n: t.Node) => void;

export default abstract class GraphBuilderState {
  public readonly scope = new ScopeManager();
  public readonly graph = new DepsGraph(this.scope);
  public readonly meta = new Map<string, any>();

  protected callbacks: OnVisitCallback[] = [];

  /*
   * For expressions like `{ foo: bar }` we need to now context
   *
   * const obj = { foo: bar };
   * Here context is `expression`, `bar` is a variable which depends from its declaration.
   *
   * const { foo: bar } = obj;
   * Here context is `pattern` and `bar` is a variable declaration itself.
   */
  public readonly context: Array<'expression' | 'lval'> = [];

  public readonly fnStack: t.Node[] = [];

  public onVisit(callback: OnVisitCallback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((c) => c !== callback);
    };
  }

  abstract baseVisit<TNode extends t.Node>(
    node: TNode,
    ignoreDeps?: boolean
  ): void;

  abstract visit<TNode extends t.Node, TParent extends t.Node>(
    node: TNode,
    parent: TParent | null,
    parentKey: t.VisitorKeys[TParent['type']] | null,
    listIdx?: number | null
  ): void;
}
