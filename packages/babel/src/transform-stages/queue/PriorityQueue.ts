import type { Debugger } from '@linaria/logger';

import type { IEntrypoint } from './types';

export interface IBaseNode {
  entrypoint: IEntrypoint;
  refCount?: number;
  stack: string[];
  type: string;
}

export type Next<TNode extends IBaseNode> = (item: TNode) => void;

export abstract class PriorityQueue<TNode extends IBaseNode> {
  private data: Array<TNode> = [];

  private keys: Map<string, number> = new Map();

  protected constructor(
    private readonly log: Debugger,
    private readonly keyOf: (node: TNode) => string,
    private readonly merge: (a: TNode, b: TNode, next: Next<TNode>) => void,
    private readonly hasLessPriority: (a: TNode, b: TNode) => boolean
  ) {}

  private get size() {
    return this.data.length;
  }

  private delete(key: string) {
    const idx = this.keys.get(key);
    if (idx === undefined) return;

    if (idx === this.size - 1) {
      this.data.pop();
      this.keys.delete(key);
      return;
    }

    if (this.size <= 1) {
      this.data = [];
      this.keys.clear();
      return;
    }

    this.data[idx] = this.data.pop()!;
    this.keys.delete(key);
    this.updateKey(idx + 1);
    this.heapifyDown(1);
    this.heapifyUp(this.size);
  }

  private heapifyDown(i = 1): void {
    const leftIdx = 2 * i;
    const rightIdx = 2 * i + 1;
    let largestIdx = i;

    if (
      leftIdx <= this.size &&
      this.hasLessPriority(this.data[largestIdx - 1], this.data[leftIdx - 1])
    ) {
      largestIdx = leftIdx;
    }

    if (
      rightIdx <= this.size &&
      this.hasLessPriority(this.data[largestIdx - 1], this.data[rightIdx - 1])
    ) {
      largestIdx = rightIdx;
    }

    if (largestIdx !== i) {
      this.swap(i, largestIdx);
      this.heapifyDown(largestIdx);
    }
  }

  private heapifyUp(i: number) {
    let idx = i;
    while (
      idx > 1 &&
      this.hasLessPriority(
        this.data[Math.floor(idx / 2) - 1],
        this.data[idx - 1]
      )
    ) {
      this.swap(Math.floor(idx / 2), idx);
      idx = Math.floor(idx / 2);
    }
  }

  private increaseKey(i: number, el: TNode) {
    this.data[i - 1] = el;
    this.updateKey(i);
    this.heapifyUp(i);
  }

  private swap(i1: number, i2: number) {
    const tmp = this.data[i1 - 1];
    this.data[i1 - 1] = this.data[i2 - 1];
    this.data[i2 - 1] = tmp;

    this.updateKey(i1);
    this.updateKey(i2);
  }

  private updateKey(i: number) {
    this.keys.set(this.keyOf(this.data[i - 1]), i - 1);
  }

  protected dequeue(): TNode | undefined {
    if (this.size === 0) return undefined;
    const max = this.data[0];

    if (this.size === 1) {
      this.data = [];
      this.keys.clear();
      this.log('Dequeued %s', this.keyOf(max));
      return max;
    }

    const last = this.data.pop();
    if (last !== undefined) {
      this.data[0] = last;
      this.updateKey(1);
      this.heapifyDown(1);
    }

    this.keys.delete(this.keyOf(max));
    this.log('Dequeued %s: %o', this.keyOf(max), this.data.map(this.keyOf));
    return max;
  }

  protected enqueue(el: TNode) {
    const key = this.keyOf(el);
    const idx = this.keys.get(key);
    if (idx !== undefined) {
      // Merge with existing entry
      const node = this.data[idx];
      this.delete(key);
      this.merge(node, el, (newNode) => {
        this.enqueue(newNode);
      });

      return;
    }

    this.increaseKey(this.size + 1, el);
    this.log('Enqueued %s: %o', key, this.data.map(this.keyOf));
    if (el.entrypoint.abortSignal) {
      el.entrypoint.abortSignal.addEventListener('abort', () => {
        this.log('Aborting %s', key);
        this.delete(key);
      });
    }
  }

  public isEmpty() {
    return this.size === 0;
  }
}
