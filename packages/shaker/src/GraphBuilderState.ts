import type { Node } from '@babel/types';
import type { VisitorKeys } from '@linaria/babel-preset';
import ScopeManager from './scope';
import DepsGraph from './DepsGraph';
import { VisitorAction } from './types';

export type OnVisitCallback = (n: Node) => void;

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

  public readonly fnStack: Node[] = [];

  public onVisit(callback: OnVisitCallback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((c) => c !== callback);
    };
  }

  abstract baseVisit<TNode extends Node>(
    node: TNode,
    ignoreDeps?: boolean
  ): void;

  abstract visit<TNode extends Node, TParent extends Node>(
    node: TNode,
    parent: TParent | null,
    parentKey: VisitorKeys<TParent> | null,
    listIdx?: number | null
  ): VisitorAction;
}
