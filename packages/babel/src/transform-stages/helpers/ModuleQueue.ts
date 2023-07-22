import { relative, sep } from 'path';

import type { TransformOptions } from '@babel/core';

import type { CustomDebug } from '@linaria/logger';
import { createCustomDebug } from '@linaria/logger';
import type { Evaluator } from '@linaria/utils';
import { getFileIdx } from '@linaria/utils';

export interface IEntrypoint {
  code: string;
  evaluator: Evaluator;
  name: string;
  only: string[];
  parseConfig: TransformOptions;
}

type Node = [entrypoint: IEntrypoint, stack: string[], refCount?: number];

export type NextItem = {
  entrypoint: IEntrypoint;
  stack: string[];
  refCount?: number;
};

const peek = <T>(arr: T[]) =>
  arr.length > 0 ? arr[arr.length - 1] : undefined;

const hasLessPriority = (
  [{ name: nameA }, stackA, refCountA = 0]: Node,
  [{ name: nameB }, stackB, refCountB = 0]: Node
) => {
  const firstA = peek(stackA);
  const firstB = peek(stackB);
  if (refCountA === refCountB && firstA && firstB) {
    const distanceA = relative(firstA, nameA).split(sep).length;
    const distanceB = relative(firstB, nameB).split(sep).length;
    return distanceA > distanceB;
  }

  return refCountA > refCountB;
};

const nameOf = ([entrypoint]: Node): string => entrypoint.name;

const keyOf = ([entrypoint]: Node): string => {
  return entrypoint.name;
};

export class ModuleQueue {
  private data: Array<Node> = [];

  private keys: Map<string, number> = new Map();

  private readonly log: CustomDebug;

  constructor(entrypoint: IEntrypoint) {
    this.data = [[entrypoint, []]];
    this.log = createCustomDebug('transform', getFileIdx(entrypoint.name));

    this.log('queue', 'Created for entrypoint %s', entrypoint.name);
  }

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
      hasLessPriority(this.data[largestIdx - 1], this.data[leftIdx - 1])
    ) {
      largestIdx = leftIdx;
    }

    if (
      rightIdx <= this.size &&
      hasLessPriority(this.data[largestIdx - 1], this.data[rightIdx - 1])
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
      hasLessPriority(this.data[Math.floor(idx / 2) - 1], this.data[idx - 1])
    ) {
      this.swap(Math.floor(idx / 2), idx);
      idx = Math.floor(idx / 2);
    }
  }

  private increaseKey(i: number, el: Node) {
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
    this.keys.set(keyOf(this.data[i - 1]), i - 1);
  }

  public dequeue(): NextItem | undefined {
    if (this.size === 0) return undefined;
    const max = this.data[0];
    const result: NextItem = {
      entrypoint: max[0],
      stack: max[1],
      refCount: max[2],
    };

    if (this.size === 1) {
      this.data = [];
      this.keys.clear();
      this.log('queue', 'Dequeued %s', nameOf(max));
      return result;
    }

    const last = this.data.pop();
    if (last !== undefined) {
      this.data[0] = last;
      this.updateKey(1);
      this.heapifyDown(1);
    }

    this.keys.delete(keyOf(max));
    this.log('queue', 'Dequeued %s: %o', nameOf(max), this.data.map(nameOf));
    return result;
  }

  public enqueue(el: Node) {
    const key = keyOf(el);
    const idx = this.keys.get(key);
    if (idx !== undefined) {
      const [entrypoint, , refCount = 0] = this.data[idx];
      this.delete(key);
      this.log('queue', 'Increase refCount of %s to %d', key, refCount + 1);
      const replacement = {
        ...entrypoint,
        only: [...new Set([...entrypoint.only, ...el[0].only])],
      };

      this.enqueue([replacement, el[1], refCount + 1]);
      return;
    }

    this.increaseKey(this.size + 1, el);
    this.log('queue', 'Enqueued %s: %o', nameOf(el), this.data.map(nameOf));
  }

  public isEmpty() {
    return this.size === 0;
  }
}
