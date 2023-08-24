import type { TransformOptions } from '@babel/core';
import type { File } from '@babel/types';

import type { Debugger } from '@linaria/logger';
import type { Evaluator, StrictOptions } from '@linaria/utils';

import { getIdx, includes } from './Entrypoint.helpers';
import type { IEntrypointCode } from './Entrypoint.types';
import type { ActionByType } from './actions/BaseAction';
import { BaseAction } from './actions/BaseAction';
import type { IEntrypoint, Services, Handlers, ActionTypes } from './types';

const EMPTY_FILE = '=== empty file ===';

type CreateArgs<TMode extends 'async' | 'sync'> = [
  services: Services,
  actionHandlers: Handlers<TMode>,
  name: string,
  only: string[],
  loadedCode: string | undefined,
  pluginOptions: StrictOptions,
];

export class Entrypoint<TMode extends 'async' | 'sync'>
  implements IEntrypoint, IEntrypointCode
{
  private static innerCreate<TMode extends 'async' | 'sync'>(
    mode: TMode,
    services: Services,
    actionHandlers: Handlers<TMode>,
    parent: Entrypoint<TMode> | null,
    name: string,
    only: string[],
    loadedCode: string | undefined,
    pluginOptions: StrictOptions
  ): ['ready', Entrypoint<TMode>] | ['ignored', Entrypoint<TMode> | null] {
    const { cache } = services;

    const cached = cache.get('entrypoints', name) as
      | Entrypoint<TMode>
      | undefined;
    const changed =
      loadedCode !== undefined
        ? cache.invalidateIfChanged(name, loadedCode)
        : false;

    const mergedOnly =
      !changed && cached?.only
        ? Array.from(new Set([...cached.only, ...only]))
            .filter((i) => i)
            .sort()
        : only;

    if (!changed && cached) {
      const isLoop = parent && parent.ancestorOrSelf(name) !== null;
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

    const loadedAndParsed = services.loadAndParseFn(
      services,
      name,
      loadedCode,
      parent?.log ?? services.log,
      pluginOptions
    );

    if (loadedAndParsed === 'ignored') {
      return ['ignored', null];
    }

    cache.invalidateIfChanged(name, loadedAndParsed.code);
    cache.add('originalAST', name, loadedAndParsed.ast);

    const newEntrypoint = new Entrypoint(
      mode,
      services,
      actionHandlers,
      parent,
      loadedAndParsed.ast,
      loadedAndParsed.code,
      loadedAndParsed.evalConfig,
      loadedAndParsed.evaluator,
      name,
      mergedOnly,
      pluginOptions
    );

    if (cached) {
      cached.log('is cached, but with different code');
      cached.supersede(newEntrypoint);
    }

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
  protected static create<TMode extends 'async' | 'sync'>(
    mode: TMode,
    services: Services,
    actionHandlers: Handlers<TMode>,
    parent: Entrypoint<TMode> | null,
    name: string,
    only: string[],
    loadedCode: string | undefined,
    pluginOptions: StrictOptions
  ): Entrypoint<TMode> | 'ignored' {
    const { cache, eventEmitter } = services;
    return eventEmitter.pair({ method: 'createEntrypoint' }, () => {
      const [status, entrypoint] = Entrypoint.innerCreate(
        mode,
        services,
        actionHandlers,
        parent,
        name,
        only,
        loadedCode,
        pluginOptions
      );

      if (entrypoint) {
        cache.add('entrypoints', name, entrypoint);
      }

      return status === 'ignored' ? 'ignored' : entrypoint;
    });
  }

  private static createRoot<TMode extends 'async' | 'sync'>(
    mode: TMode,
    services: Services,
    actionHandlers: Handlers<TMode>,
    name: string,
    only: string[],
    loadedCode: string | undefined,
    pluginOptions: StrictOptions
  ): Entrypoint<TMode> | 'ignored' {
    return Entrypoint.create(
      mode,
      services,
      actionHandlers,
      null,
      name,
      only,
      loadedCode,
      pluginOptions
    );
  }

  public static createSyncRoot(...args: CreateArgs<'sync'>) {
    return Entrypoint.createRoot('sync', ...args);
  }

  public static createAsyncRoot(...args: CreateArgs<'async' | 'sync'>) {
    return Entrypoint.createRoot('async', ...args);
  }

  public readonly idx: string;

  public readonly log: Debugger;

  #supersededWith: Entrypoint<TMode> | null = null;

  public get isSuperseded() {
    return this.#supersededWith !== null;
  }

  public get supersededWith() {
    return this.#supersededWith;
  }

  protected onSupersedeHandlers: Array<
    (newEntrypoint: Entrypoint<TMode>) => void
  > = [];

  private actionsCache: Map<
    keyof Handlers<TMode>,
    Map<unknown, BaseAction<TMode, ActionTypes>>
  > = new Map();

  private constructor(
    public readonly mode: TMode,
    protected services: Services,
    protected actionHandlers: Handlers<TMode>,
    public readonly parent: Entrypoint<TMode> | null,
    public readonly ast: File,
    public readonly code: string,
    public readonly evalConfig: TransformOptions,
    public readonly evaluator: Evaluator,
    public readonly name: string,
    public readonly only: string[],
    public readonly pluginOptions: StrictOptions,
    public readonly generation = 1
  ) {
    this.idx = getIdx(name);
    this.log =
      parent?.log.extend(this.idx, '->') ?? services.log.extend(this.idx);

    this.only = only;

    Object.keys(actionHandlers).forEach((type) => {
      this.actionsCache.set(type as keyof Handlers<TMode>, new Map());
    });

    this.log.extend('source')(
      'created %s (%o)\n%s',
      name,
      only,
      code || EMPTY_FILE
    );
  }

  public ancestorOrSelf(name: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let next: Entrypoint<TMode> | null = this;
    while (next) {
      if (next.name === name) {
        return next;
      }

      next = next.parent;
    }

    return null;
  }

  public createAction<TType extends ActionTypes>(
    actionType: TType,
    data: ActionByType<TMode, TType>['data'],
    abortSignal: AbortSignal | null = null
  ): {
    [K in TType]: BaseAction<TMode, K, ActionByType<TMode, K>>;
  }[TType] {
    const cache = this.actionsCache.get(actionType)!;
    const cached = cache.get(data);
    if (cached) {
      return cached as BaseAction<TMode, TType, ActionByType<TMode, TType>>;
    }

    const newAction = new BaseAction<TMode, TType, ActionByType<TMode, TType>>(
      this.mode,
      actionType,
      this.services,
      this,
      data,
      abortSignal,
      this.actionHandlers[actionType]
    );

    cache.set(data, newAction);

    return newAction;
  }

  public createChild(
    name: string,
    only: string[],
    loadedCode?: string
  ): Entrypoint<TMode> | 'ignored' {
    return Entrypoint.create(
      this.mode,
      this.services,
      this.actionHandlers,
      this,
      name,
      only,
      loadedCode,
      this.pluginOptions
    );
  }

  protected supersede(
    newOnlyOrEntrypoint: string[] | Entrypoint<TMode>
  ): Entrypoint<TMode> {
    const newEntrypoint =
      newOnlyOrEntrypoint instanceof Entrypoint
        ? newOnlyOrEntrypoint
        : new Entrypoint(
            this.mode,
            this.services,
            this.actionHandlers,
            this.parent,
            this.ast,
            this.code,
            this.evalConfig,
            this.evaluator,
            this.name,
            newOnlyOrEntrypoint,
            this.pluginOptions,
            this.generation + 1
          );

    this.log('superseded by %s', newEntrypoint.name);
    this.#supersededWith = newEntrypoint;
    this.onSupersedeHandlers.forEach((handler) => handler(newEntrypoint));

    return newEntrypoint;
  }

  public onSupersede(callback: (newEntrypoint: Entrypoint<TMode>) => void) {
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
