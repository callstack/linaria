import { createHash } from 'crypto';

import type { File } from '@babel/types';

import { linariaLogger } from '@linaria/logger';

import type { IModule } from './module';
import type { IEntrypoint } from './transform-stages/queue/types';
import type { ITransformFileResult } from './types';

function hashContent(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

interface ICaches {
  entrypoints: Map<string, IEntrypoint<unknown>>;
  ignored: Map<string, true>;
  resolve: Map<string, string>;
  resolveTask: Map<
    string,
    Promise<{
      importedFile: string;
      importsOnly: string[];
      resolved: string | null;
    }>
  >;
  code: Map<
    string,
    {
      imports: Map<string, string[]> | null;
      only: string[];
      result: ITransformFileResult;
    }
  >;
  eval: Map<string, IModule>;
  originalAST: Map<string, File>;
}

type MapValue<T> = T extends Map<string, infer V> ? V : never;

const cacheLogger = linariaLogger.extend('cache');

const cacheNames = [
  'entrypoints',
  'ignored',
  'resolve',
  'resolveTask',
  'code',
  'eval',
  'originalAST',
] as const;
type CacheNames = typeof cacheNames[number];

const loggers = cacheNames.reduce(
  (acc, key) => ({
    ...acc,
    [key]: cacheLogger.extend(key),
  }),
  {} as Record<CacheNames, typeof linariaLogger>
);

export class TransformCacheCollection {
  private contentHashes = new Map<string, string>();

  protected readonly entrypoints: Map<string, IEntrypoint>;

  protected readonly ignored: Map<string, true>;

  protected readonly resolve: Map<string, string>;

  protected readonly resolveTask: Map<string, Promise<string>>;

  protected readonly code: Map<
    string,
    {
      imports: Map<string, string[]> | null;
      only: string[];
      result: ITransformFileResult;
    }
  >;

  protected readonly eval: Map<string, IModule>;

  protected readonly originalAST: Map<string, File>;

  constructor(caches: Partial<ICaches> = {}) {
    this.entrypoints = caches.entrypoints || new Map();
    this.ignored = caches.ignored || new Map();
    this.resolve = caches.resolve || new Map();
    this.resolveTask = caches.resolveTask || new Map();
    this.code = caches.code || new Map();
    this.eval = caches.eval || new Map();
    this.originalAST = caches.originalAST || new Map();
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
    }
  }

  public add<
    TCache extends CacheNames,
    TValue extends MapValue<ICaches[TCache]>
  >(cacheName: TCache, key: string, value: TValue): void {
    const cache = this[cacheName] as Map<string, TValue>;
    loggers[cacheName]('add %s %f', key, () => {
      if (!cache.has(key)) {
        return 'added';
      }

      return cache.get(key) === value ? 'unchanged' : 'updated';
    });

    cache.set(key, value);
  }

  public get<
    TCache extends CacheNames,
    TValue extends MapValue<ICaches[TCache]>
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

  public clear(cacheName: CacheNames): void {
    loggers[cacheName]('clear');
    const cache = this[cacheName] as Map<string, unknown>;

    cache.clear();
  }
}
