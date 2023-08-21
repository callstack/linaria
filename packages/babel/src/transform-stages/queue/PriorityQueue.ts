import { nanoid } from 'nanoid';

const keys = new WeakMap<object, string>();
const keyFor = (obj: object | number | string): string => {
  if (typeof obj === 'object') {
    if (!keys.has(obj)) {
      keys.set(obj, nanoid(10));
    }

    return keys.get(obj)!;
  }

  return obj.toString();
};

export abstract class PriorityQueue<
  TNode extends object | { toString(): string },
> {
  protected data: Array<TNode> = [];

  protected keys: Map<string, number> = new Map();

  protected dequeueCallbacks: Map<TNode, () => void> = new Map();

  protected constructor(
    private readonly hasLessPriority: (a: TNode, b: TNode) => boolean
  ) {}

  private get size() {
    return this.data.length;
  }

  protected delete(node: TNode) {
    const key = keyFor(node);
    const idx = this.keys.get(key);
    if (idx === undefined) return;

    if (idx === this.size - 1) {
      const deleted = this.data.pop();
      this.onDequeue(deleted);
      this.keys.delete(key);
      return;
    }

    if (this.size <= 1) {
      const deleted = this.data[0];
      this.data = [];
      this.keys.clear();
      this.onDequeue(deleted);
      return;
    }

    const deleted = this.data[idx];
    this.data[idx] = this.data.pop()!;
    this.keys.delete(key);
    this.updateKey(idx + 1);
    this.heapifyDown(1);
    this.heapifyUp(this.size);
    this.onDequeue(deleted);
  }

  private onDequeue(node: TNode | undefined) {
    if (node === undefined) return;
    const callback = this.dequeueCallbacks.get(node);
    this.dequeueCallbacks.delete(node);
    callback?.();
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
    this.keys.set(keyFor(this.data[i - 1]), i - 1);
  }

  protected dequeue(): TNode | undefined {
    if (this.size === 0) return undefined;
    const max = this.data[0];

    if (this.size === 1) {
      this.data = [];
      this.keys.clear();
      this.onDequeue(max);
      return max;
    }

    const last = this.data.pop();
    if (last !== undefined) {
      this.data[0] = last;
      this.updateKey(1);
      this.heapifyDown(1);
    }

    this.keys.delete(keyFor(max));
    this.onDequeue(max);
    return max;
  }

  protected enqueue(newNode: TNode, onDequeue?: () => void) {
    const key = keyFor(newNode);
    if (this.keys.has(key)) {
      throw new Error(`Key ${key} already exists`);
    }

    if (onDequeue) {
      this.dequeueCallbacks.set(newNode, onDequeue);
    }

    this.increaseKey(this.size + 1, newNode);
  }

  public isEmpty() {
    return this.size === 0;
  }
}
