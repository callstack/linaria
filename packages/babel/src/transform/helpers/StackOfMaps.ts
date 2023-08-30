export class StackOfMaps<TKeys, TValues> implements Map<TKeys, TValues> {
  private readonly stack: Map<TKeys, () => TValues>[] = [new Map()];

  public get [Symbol.toStringTag]() {
    return this.stack.map((map) => map[Symbol.toStringTag]).join(' -> ');
  }

  public get size() {
    return this.stack.reduce((size, map) => size + map.size, 0);
  }

  public [Symbol.iterator](): IterableIterator<[TKeys, TValues]> {
    return this.entries();
  }

  public join(stack: StackOfMaps<TKeys, TValues>): void {
    this.stack.unshift(...stack.stack);
  }

  public clear(): void {
    this.stack.forEach((map) => map.clear());
  }

  public delete(key: TKeys): boolean {
    let result = false;
    for (const map of this.stack) {
      if (map.delete(key)) {
        result = true;
      }
    }

    return result;
  }

  public *entries(): IterableIterator<[TKeys, TValues]> {
    const processed = new Set<TKeys>();
    for (const map of this.stack) {
      for (const [key, valueFn] of map.entries()) {
        if (processed.has(key)) {
          // eslint-disable-next-line no-continue
          continue;
        }

        const value = valueFn?.();
        if (value !== undefined) {
          processed.add(key);
          yield [key, value];
        }
      }
    }
  }

  public forEach(
    callbackFn: (value: TValues, key: TKeys, map: Map<TKeys, TValues>) => void,
    thisArg?: unknown
  ): void {
    for (const [key, value] of this.entries()) {
      callbackFn.call(thisArg, value, key, this);
    }
  }

  public get(key: TKeys): TValues | undefined {
    const allDefined = this.stack.map((map) => map.get(key));
    for (const fn of allDefined) {
      const value = fn?.();
      if (value !== undefined) {
        return value;
      }
    }

    return undefined;
  }

  public has(key: TKeys): boolean {
    for (const map of this.stack) {
      if (map.has(key)) {
        return true;
      }
    }

    return false;
  }

  public *keys(): IterableIterator<TKeys> {
    for (const [key] of this.entries()) {
      yield key;
    }
  }

  public set(key: TKeys, value: TValues): this {
    this.stack[0].set(key, () => value);
    return this;
  }

  public setLazy(key: TKeys, value: () => TValues): this {
    this.stack[0].set(key, value);
    return this;
  }

  public *values(): IterableIterator<TValues> {
    for (const [, value] of this.entries()) {
      yield value;
    }
  }
}
