import { createHash } from 'crypto';

import { linariaLogger } from '@linaria/logger';
import { getFileIdx } from '@linaria/utils';

import type { Entrypoint } from './transform/Entrypoint';
import type { IEvaluatedEntrypoint } from './transform/EvaluatedEntrypoint';

function hashContent(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

interface ICaches {
  entrypoints: Map<string, Entrypoint | IEvaluatedEntrypoint>;
  exports: Map<string, string[]>;
}

type MapValue<T> = T extends Map<string, infer V> ? V : never;

const cacheLogger = linariaLogger.extend('cache');

const cacheNames = ['entrypoints', 'exports'] as const;
type CacheNames = (typeof cacheNames)[number];

const loggers = cacheNames.reduce(
  (acc, key) => ({
    ...acc,
    [key]: cacheLogger.extend(key),
  }),
  {} as Record<CacheNames, typeof linariaLogger>
);

export class TransformCacheCollection {
  public readonly entrypoints: Map<string, Entrypoint | IEvaluatedEntrypoint>;

  public readonly exports: Map<string, string[]>;

  private contentHashes = new Map<string, string>();

  constructor(caches: Partial<ICaches> = {}) {
    this.entrypoints = caches.entrypoints || new Map();
    this.exports = caches.exports || new Map();
  }

  public add<
    TCache extends CacheNames,
    TValue extends MapValue<ICaches[TCache]>,
  >(cacheName: TCache, key: string, value: TValue): void {
    const cache = this[cacheName] as Map<string, TValue>;
    loggers[cacheName](
      '%s:add %s %f',
      getFileIdx(key).toString().padStart(5, '0'),
      key,
      () => {
        if (!cache.has(key)) {
          return 'added';
        }

        return cache.get(key) === value ? 'unchanged' : 'updated';
      }
    );

    cache.set(key, value);
  }

  public clear(cacheName: CacheNames | 'all'): void {
    if (cacheName === 'all') {
      cacheNames.forEach((name) => {
        this.clear(name);
      });

      return;
    }

    loggers[cacheName]('clear');
    const cache = this[cacheName] as Map<string, unknown>;

    cache.clear();
  }

  public delete(cacheName: CacheNames, key: string): void {
    this.invalidate(cacheName, key);
  }

  public get<
    TCache extends CacheNames,
    TValue extends MapValue<ICaches[TCache]>,
  >(cacheName: TCache, key: string): TValue | undefined {
    const cache = this[cacheName] as Map<string, TValue>;

    const res = cache.get(key);
    loggers[cacheName]('get', key, res === undefined ? 'miss' : 'hit');
    return res;
  }

  public has(cacheName: CacheNames, key: string): boolean {
    const cache = this[cacheName] as Map<string, unknown>;

    const res = cache.has(key);
    loggers[cacheName]('has', key, res);
    return res;
  }

  public invalidate(cacheName: CacheNames, key: string): void {
    const cache = this[cacheName] as Map<string, unknown>;
    if (!cache.has(key)) {
      return;
    }

    loggers[cacheName]('invalidate', key);

    cache.delete(key);
  }

  public invalidateForFile(filename: string) {
    cacheNames.forEach((cacheName) => {
      this.invalidate(cacheName, filename);
    });
  }

  public invalidateIfChanged(filename: string, content: string) {
    const hash = this.contentHashes.get(filename);
    const newHash = hashContent(content);

    if (hash !== newHash) {
      cacheLogger('content has changed, invalidate all for %s', filename);
      this.contentHashes.set(filename, newHash);
      this.invalidateForFile(filename);

      return true;
    }

    return false;
  }
}
