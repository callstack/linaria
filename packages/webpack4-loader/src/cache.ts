export interface ICache {
  get: (key: string) => Promise<string>;
  set: (key: string, value: string) => Promise<void>;
  getDependencies?: (key: string) => Promise<string[]>;
  setDependencies?: (key: string, value: string[]) => Promise<void>;
}

// memory cache, which is the default cache implementation in Linaria

class MemoryCache implements ICache {
  private cache: Map<string, string> = new Map();

  private dependenciesCache: Map<string, string[]> = new Map();

  public get(key: string): Promise<string> {
    return Promise.resolve(this.cache.get(key) ?? '');
  }

  public set(key: string, value: string): Promise<void> {
    this.cache.set(key, value);
    return Promise.resolve();
  }

  public getDependencies(key: string): Promise<string[]> {
    return Promise.resolve(this.dependenciesCache.get(key) ?? []);
  }

  public setDependencies(key: string, value: string[]): Promise<void> {
    this.dependenciesCache.set(key, value);
    return Promise.resolve();
  }
}

export const memoryCache = new MemoryCache();

/**
 * return cache instance from `options.cacheProvider`
 * @param cacheProvider string | ICache | undefined
 * @returns ICache instance
 */
export const getCacheInstance = async (
  cacheProvider: string | ICache | undefined
): Promise<ICache> => {
  if (!cacheProvider) {
    return memoryCache;
  }
  if (typeof cacheProvider === 'string') {
    return require(cacheProvider);
  }
  if (
    typeof cacheProvider === 'object' &&
    'get' in cacheProvider &&
    'set' in cacheProvider
  ) {
    return cacheProvider;
  }
  throw new Error(`Invalid cache provider: ${cacheProvider}`);
};
