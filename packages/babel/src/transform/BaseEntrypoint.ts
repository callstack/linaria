/* eslint-disable no-param-reassign */
import type { Debugger } from '@linaria/logger';
import { getFileIdx } from '@linaria/utils';

import type { ParentEntrypoint } from '../types';

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
): obj is { [VALUES]: Record<string | symbol, unknown> } =>
  typeof obj === 'object' && obj !== null && VALUES in obj;

export const createExports = (log: Debugger) => {
  let exports: Record<string | symbol, unknown> = {};
  const lazyFields = new Set<string | symbol>();

  return new Proxy(exports, {
    get: (_target, key) => {
      if (key === VALUES) {
        return exports;
      }

      let value: unknown;
      if (key in exports) {
        value = exports[key];
      } else {
        // Support Object.prototype methods on `exports`
        // e.g `exports.hasOwnProperty`
        value = Reflect.get(exports, key);
      }

      if (value === undefined && 'default' in exports) {
        const defaultValue = exports.default;
        if (hasKey(defaultValue, key)) {
          log(
            '⚠️  %s has been found in `default`. It indicates that ESM to CJS conversion went wrong.',
            key
          );
          value = defaultValue[key];
        }
      }

      if (value !== undefined && lazyFields.has(key)) {
        value = (value as () => unknown)();
      }

      log('get %s: %o', key, value);
      return value;
    },
    has: (_target, key) => {
      if (key === VALUES) return true;
      return key in exports;
    },
    ownKeys: () => {
      return Object.keys(exports);
    },
    set: (_target, key, value) => {
      if (key === VALUES) {
        exports = value;
        return true;
      }

      if (key !== '__esModule') {
        log('set %s: %o', key, value);
      }

      if (value !== undefined) {
        exports[key] = value;
        lazyFields.delete(key);
      }

      return true;
    },
    defineProperty: (_target, key, descriptor) => {
      const { value } = descriptor;
      if (value !== undefined) {
        if (key !== '__esModule') {
          log('defineProperty %s with value %o', key, value);
        }

        exports[key] = value;
        lazyFields.delete(key);

        return true;
      }

      if ('get' in descriptor) {
        if (lazyFields.has(key)) {
          const prev = exports[key] as () => void;
          exports[key] = () => {
            const v = descriptor.get?.();
            if (v !== undefined) {
              return v;
            }

            return prev();
          };
        } else {
          const prev = exports[key];
          exports[key] = () => {
            const v = descriptor.get?.();
            if (v !== undefined) {
              return v;
            }

            return prev;
          };
        }

        lazyFields.add(key);
        log('defineProperty %s with getter', key);
      }

      return true;
    },
    getOwnPropertyDescriptor: (_target, key) => {
      if (key in exports)
        return {
          enumerable: true,
          configurable: true,
        };

      return undefined;
    },
  });
};

const EXPORTS = Symbol('exports');

let entrypointSeqId = 0;

export abstract class BaseEntrypoint {
  public static createExports = createExports;

  public readonly idx: string;

  public readonly log: Debugger;

  // eslint-disable-next-line no-plusplus
  public readonly seqId = entrypointSeqId++;

  readonly #exports: Record<string | symbol, unknown>;

  protected constructor(
    protected services: Services,
    public readonly evaluatedOnly: string[],
    exports: Record<string | symbol, unknown> | undefined,
    public readonly generation: number,
    public readonly name: string,
    public readonly only: string[],
    public readonly parents: ParentEntrypoint[]
  ) {
    this.idx = getIdx(name);
    this.log =
      parents[0]?.log.extend(this.ref, '->') ?? services.log.extend(this.ref);

    let isExportsInherited = false;
    if (exports) {
      if (isProxy(exports)) {
        this.#exports = exports;
        isExportsInherited = true;
      } else {
        this.#exports = createExports(this.log);
        this.#exports[EXPORTS] = exports;
      }
      this.exports = exports;
    } else {
      this.#exports = BaseEntrypoint.createExports(this.log);
    }

    services.eventEmitter.entrypointEvent(this.seqId, {
      class: this.constructor.name,
      evaluatedOnly: this.evaluatedOnly,
      filename: name,
      generation,
      idx: this.idx,
      isExportsInherited,
      only,
      parentId: parents[0]?.seqId ?? null,
      type: 'created',
    });
  }

  public get exports(): Record<string | symbol, unknown> {
    if (EXPORTS in this.#exports) {
      return this.#exports[EXPORTS] as Record<string | symbol, unknown>;
    }

    return this.#exports;
  }

  public set exports(value: unknown) {
    if (isProxy(value)) {
      this.#exports[VALUES] = value[VALUES];
    } else {
      this.#exports[EXPORTS] = value;
    }
  }

  public get ref() {
    return `${this.idx}#${this.generation}`;
  }

  protected get exportsProxy() {
    return this.#exports;
  }
}
