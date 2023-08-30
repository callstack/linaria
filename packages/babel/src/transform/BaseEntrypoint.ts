import type { Debugger } from '@linaria/logger';
import { getFileIdx } from '@linaria/utils';

import type { ParentEntrypoint } from '../types';

import { StackOfMaps } from './helpers/StackOfMaps';
import type { Services } from './types';

const getIdx = (fn: string) => getFileIdx(fn).toString().padStart(5, '0');

const hasKey = <TKey extends string | symbol>(
  obj: unknown,
  key: TKey
): obj is Record<TKey, unknown> =>
  (typeof obj === 'object' || typeof obj === 'function') &&
  obj !== null &&
  key in obj;

const VALUES = Symbol('values');

const isProxy = (
  obj: unknown
): obj is { [VALUES]: StackOfMaps<string | symbol, unknown> } =>
  typeof obj === 'object' && obj !== null && VALUES in obj;

const getLazyValues = (obj: unknown) => {
  if (isProxy(obj)) {
    return obj[VALUES];
  }

  if (obj instanceof StackOfMaps) {
    return obj;
  }

  return new StackOfMaps<string | symbol, unknown>();
};

interface IExportsContainer {
  readonly exportsValues: StackOfMaps<string | symbol, unknown>;
  log: Debugger;
}

const cachedExports = new WeakMap<
  StackOfMaps<string | symbol, unknown>,
  Record<string | symbol, unknown>
>();

const createExports = (container: IExportsContainer) => {
  if (cachedExports.has(container.exportsValues)) {
    return cachedExports.get(container.exportsValues)!;
  }

  const exports: Record<string | symbol, unknown> = {};

  const proxy = new Proxy(exports, {
    get: (target, key) => {
      if (key === VALUES) {
        return container.exportsValues;
      }

      let value: unknown;
      if (container.exportsValues.has(key)) {
        value = container.exportsValues.get(key);
      } else {
        // Support Object.prototype methods on `exports`
        // e.g `exports.hasOwnProperty`
        value = Reflect.get(target, key);
      }

      if (value === undefined && container.exportsValues.has('default')) {
        const defaultValue = container.exportsValues.get('default');
        if (hasKey(defaultValue, key)) {
          container.log(
            '⚠️  %s has been found in `default`. It indicates that ESM to CJS conversion went wrong.',
            key
          );
          value = defaultValue[key];
        }
      }

      container.log('get %s: %o', key, value);
      return value;
    },
    has: (target, key) => {
      if (key === VALUES) return true;
      return container.exportsValues.has(key);
    },
    ownKeys: () => {
      return Array.from(container.exportsValues.keys());
    },
    set: (target, key, value) => {
      if (key !== '__esModule') {
        container.log('set %s: %o', key, value);
      }

      if (value !== undefined) {
        container.exportsValues.set(key, value);
      }

      return true;
    },
    defineProperty: (target, key, descriptor) => {
      const { value } = descriptor;
      if (value !== undefined) {
        if (key !== '__esModule') {
          container.log('defineProperty %s with value %o', key, value);
        }

        container.exportsValues.set(key, value);

        return true;
      }

      if ('get' in descriptor) {
        container.exportsValues.setLazy(key, descriptor.get!);
        container.log('defineProperty %s with getter', key);
      }

      return true;
    },
    getOwnPropertyDescriptor: (target, key) => {
      if (container.exportsValues.has(key))
        return {
          enumerable: true,
          configurable: true,
        };

      return undefined;
    },
  });

  cachedExports.set(container.exportsValues, proxy);

  return proxy;
};

const EXPORTS = Symbol('exports');

export abstract class BaseEntrypoint {
  public get exports() {
    if (this.exportsValues.has(EXPORTS)) {
      return this.exportsValues.get(EXPORTS);
    }

    return createExports(this);
  }

  public set exports(value: unknown) {
    if (isProxy(value)) {
      this.exportsValues.join(getLazyValues(value));
    } else {
      this.exportsValues.set(EXPORTS, value);
    }
  }

  public readonly idx: string;

  public readonly log: Debugger;

  protected constructor(
    protected services: Services,
    public readonly evaluatedOnly: string[],
    public readonly exportsValues: StackOfMaps<string | symbol, unknown>,
    public readonly generation: number,
    public readonly name: string,
    public readonly only: string[],
    public readonly parent: ParentEntrypoint
  ) {
    this.idx = getIdx(name);
    this.log =
      parent?.log.extend(this.idx, '->') ?? services.log.extend(this.idx);
  }
}
