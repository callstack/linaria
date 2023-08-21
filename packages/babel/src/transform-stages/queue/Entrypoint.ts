import type { TransformOptions } from '@babel/core';
import type { File } from '@babel/types';

import type { Debugger } from '@linaria/logger';
import type { Evaluator, StrictOptions } from '@linaria/utils';

import { getIdx, includes, loadAndParse } from './Entrypoint.helpers';
import type { IEntrypointCode, LoadAndParseFn } from './Entrypoint.types';
import type { IEntrypoint, Services } from './types';

type CreateArgs<
  TServices extends Pick<Services, 'cache' | 'eventEmitter'>,
  TPluginOptions,
> = [
  services: TServices,
  parent: Entrypoint<TServices, TPluginOptions> | { log: Debugger },
  name: string,
  only: string[],
  loadedCode: string | undefined,
  pluginOptions: TPluginOptions,
];

const EMPTY_FILE = '=== empty file ===';

const isParent = <
  TServices extends Pick<Services, 'cache' | 'eventEmitter'>,
  TPluginOptions,
>(
  parent: Entrypoint<TServices, TPluginOptions> | { log: Debugger }
): parent is Entrypoint<TServices, TPluginOptions> => 'name' in parent;

export class Entrypoint<
    TServices extends Pick<Services, 'cache' | 'eventEmitter'>,
    TPluginOptions,
  >
  implements IEntrypoint<TPluginOptions>, IEntrypointCode
{
  private static innerCreate<
    TServices extends Pick<Services, 'cache' | 'eventEmitter'>,
    TPluginOptions,
  >(
    loadAndParseFn: LoadAndParseFn<TServices, TPluginOptions>,
    services: TServices,
    parent: Entrypoint<TServices, TPluginOptions> | { log: Debugger },
    name: string,
    only: string[],
    loadedCode: string | undefined,
    pluginOptions: TPluginOptions
  ):
    | ['ready', Entrypoint<TServices, TPluginOptions>]
    | ['ignored', Entrypoint<TServices, TPluginOptions> | null] {
    const { cache } = services;

    if (loadedCode !== undefined) {
      cache.invalidateIfChanged(name, loadedCode);
    }

    const cached = cache.get('entrypoints', name) as
      | Entrypoint<TServices, TPluginOptions>
      | undefined;

    const mergedOnly = cached?.only
      ? Array.from(new Set([...cached.only, ...only]))
          .filter((i) => i)
          .sort()
      : only;

    if (cached) {
      const isLoop = isParent(parent) && parent.ancestorOrSelf(name) !== null;
      if (isLoop) {
        parent.log('[createEntrypoint] %s is a loop', name);
      }

      if (includes(cached.only, mergedOnly)) {
        cached.log('is cached', name);
        return [isLoop ? 'ignored' : 'ready', cached];
      }

      cached.log(
        'is cached, but with different `only` %o (the cached one %o)',
        only,
        cached?.only
      );

      return [isLoop ? 'ignored' : 'ready', cached.supersede(mergedOnly)];
    }

    const loadedAndParsed = loadAndParseFn(
      services,
      name,
      loadedCode,
      parent.log,
      pluginOptions
    );

    if (loadedAndParsed === 'ignored') {
      return ['ignored', null];
    }

    cache.invalidateIfChanged(name, loadedAndParsed.code);
    cache.add('originalAST', name, loadedAndParsed.ast);

    const newEntrypoint = new Entrypoint(
      services,
      parent,
      loadedAndParsed.ast,
      loadedAndParsed.code,
      loadedAndParsed.evalConfig,
      loadedAndParsed.evaluator,
      name,
      mergedOnly,
      pluginOptions
    );

    return ['ready', newEntrypoint];
  }

  /**
   * Creates an entrypoint for the specified file.
   * If there is already an entrypoint for this file, there will be four possible outcomes:
   * 1. If `loadedCode` is specified and is different from the one that was used to create the existing entrypoint,
   *   the existing entrypoint will be superseded by a new one and all cached results for it will be invalidated.
   *   It can happen if the file was changed and the watcher notified us about it, or we received a new version
   *   of the file from a loader whereas the previous one was loaded from the filesystem.
   *   The new entrypoint will be returned.
   * 2. If `only` is subset of the existing entrypoint's `only`, the existing entrypoint will be returned.
   * 3. If `only` is superset of the existing entrypoint's `only`, the existing entrypoint will be superseded and the new one will be returned.
   * 4. If a loop is detected, 'ignored' will be returned, the existing entrypoint will be superseded or not depending on the `only` value.
   */
  public static create<
    TServices extends Services,
    TPluginOptions extends StrictOptions,
  >(
    ...args: CreateArgs<TServices, TPluginOptions>
  ): Entrypoint<TServices, TPluginOptions> | 'ignored' {
    return Entrypoint.createWithCustomLoader(loadAndParse, ...args);
  }

  /**
   * It is public for testing purposes only.
   */
  public static createWithCustomLoader<
    TServices extends Pick<Services, 'cache' | 'eventEmitter'>,
    TPluginOptions,
  >(
    customLoader: LoadAndParseFn<TServices, TPluginOptions>,
    ...args: CreateArgs<TServices, TPluginOptions>
  ): Entrypoint<TServices, TPluginOptions> | 'ignored' {
    const [{ cache, eventEmitter }, , name] = args;
    return eventEmitter.pair({ method: 'createEntrypoint' }, () => {
      const [status, entrypoint] = Entrypoint.innerCreate(
        customLoader,
        ...args
      );
      if (entrypoint) {
        cache.add('entrypoints', name, entrypoint);
      }

      return status === 'ignored' ? 'ignored' : entrypoint;
    });
  }

  public readonly idx: string;

  public readonly log: Debugger;

  public readonly parent: Entrypoint<TServices, TPluginOptions> | null = null;

  #supersededWith: Entrypoint<TServices, TPluginOptions> | null = null;

  public get isSuperseded() {
    return this.#supersededWith !== null;
  }

  public get supersededWith() {
    return this.#supersededWith;
  }

  protected onSupersedeHandlers: Array<
    (newEntrypoint: Entrypoint<TServices, TPluginOptions>) => void
  > = [];

  private constructor(
    protected services: TServices,
    parent: Entrypoint<TServices, TPluginOptions> | { log: Debugger },
    public readonly ast: File,
    public readonly code: string,
    public readonly evalConfig: TransformOptions,
    public readonly evaluator: Evaluator,
    public readonly name: string,
    public readonly only: string[],
    public readonly pluginOptions: TPluginOptions,
    public readonly generation = 1
  ) {
    this.idx = getIdx(name);
    this.log = parent.log.extend(this.idx, isParent(parent) ? '->' : ':');

    this.only = only;

    this.parent = isParent(parent) ? parent : null;

    this.log.extend('source')(
      'created %s (%o)\n%s',
      name,
      only,
      code || EMPTY_FILE
    );
  }

  public ancestorOrSelf(name: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let next: Entrypoint<TServices, TPluginOptions> | null = this;
    while (next) {
      if (next.name === name) {
        return next;
      }

      next = next.parent;
    }

    return null;
  }

  protected supersede(
    newOnly: string[]
  ): Entrypoint<TServices, TPluginOptions> {
    const newEntrypoint = new Entrypoint(
      this.services,
      this.parent ?? { log: this.log },
      this.ast,
      this.code,
      this.evalConfig,
      this.evaluator,
      this.name,
      newOnly,
      this.pluginOptions,
      this.generation + 1
    );

    this.log('superseded by %s', newEntrypoint.name);
    this.#supersededWith = newEntrypoint;
    this.onSupersedeHandlers.forEach((handler) => handler(newEntrypoint));

    return newEntrypoint;
  }

  public onSupersede(
    callback: (newEntrypoint: Entrypoint<TServices, TPluginOptions>) => void
  ) {
    if (this.#supersededWith) {
      callback(this.#supersededWith);
      return () => {};
    }

    this.onSupersedeHandlers.push(callback);

    return () => {
      const index = this.onSupersedeHandlers.indexOf(callback);
      if (index >= 0) {
        this.onSupersedeHandlers.splice(index, 1);
      }
    };
  }
}
