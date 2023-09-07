import { invariant } from 'ts-invariant';

import type { StrictOptions } from '@linaria/utils';

import type { ParentEntrypoint, ITransformFileResult } from '../types';

import { BaseEntrypoint } from './BaseEntrypoint';
import { isSuperSet, mergeOnly } from './Entrypoint.helpers';
import type {
  IEntrypointCode,
  IEntrypointDependency,
  IIgnoredEntrypoint,
} from './Entrypoint.types';
import { EvaluatedEntrypoint } from './EvaluatedEntrypoint';
import { AbortError } from './actions/AbortError';
import type { ActionByType } from './actions/BaseAction';
import { BaseAction } from './actions/BaseAction';
import type { Services, ActionTypes, ActionQueueItem } from './types';

const EMPTY_FILE = '=== empty file ===';

function ancestorOrSelf(name: string, parent: ParentEntrypoint) {
  let next = parent;
  while (next) {
    if (next.name === name) {
      return next;
    }

    next = next.parent;
  }

  return null;
}

export class Entrypoint extends BaseEntrypoint {
  public readonly evaluated = false;

  public readonly loadedAndParsed: IEntrypointCode | IIgnoredEntrypoint;

  protected onSupersedeHandlers: Array<(newEntrypoint: Entrypoint) => void> =
    [];

  private actionsCache: Map<
    ActionTypes,
    Map<unknown, BaseAction<ActionQueueItem>>
  > = new Map();

  #hasLinariaMetadata: boolean = false;

  #supersededWith: Entrypoint | null = null;

  #transformResultCode: string | null = null;

  private constructor(
    services: Services,
    parent: ParentEntrypoint,
    public readonly initialCode: string | undefined,
    name: string,
    only: string[],
    public readonly pluginOptions: StrictOptions,
    exports: Record<string | symbol, unknown> | undefined,
    evaluatedOnly: string[],
    loadedAndParsed?: IEntrypointCode | IIgnoredEntrypoint,
    protected readonly resolveTasks = new Map<
      string,
      Promise<IEntrypointDependency>
    >(),
    protected readonly dependencies = new Map<string, IEntrypointDependency>(),
    generation = 1
  ) {
    super(services, evaluatedOnly, exports, generation, name, only, parent);

    this.loadedAndParsed =
      loadedAndParsed ??
      services.loadAndParseFn(
        services,
        name,
        initialCode,
        parent?.log ?? services.log,
        pluginOptions
      );

    if (this.loadedAndParsed.code !== undefined) {
      services.cache.invalidateIfChanged(name, this.loadedAndParsed.code);
    }

    this.log.extend('source')(
      'created %s (%o)\n%s',
      name,
      only,
      this.originalCode || EMPTY_FILE
    );
  }

  public get ignored() {
    return this.loadedAndParsed.evaluator === 'ignored';
  }

  public get originalCode() {
    return this.loadedAndParsed.code;
  }

  public get supersededWith(): Entrypoint | null {
    return this.#supersededWith?.supersededWith ?? this.#supersededWith;
  }

  public get transformedCode(): string | null {
    return (
      this.#transformResultCode ?? this.supersededWith?.transformedCode ?? null
    );
  }

  public static createRoot(
    services: Services,
    name: string,
    only: string[],
    loadedCode: string | undefined,
    pluginOptions: StrictOptions
  ): Entrypoint {
    const created = Entrypoint.create(
      services,
      null,
      name,
      only,
      loadedCode,
      pluginOptions
    );
    invariant(created !== 'loop', 'loop detected');

    return created;
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
  protected static create(
    services: Services,
    parent: ParentEntrypoint,
    name: string,
    only: string[],
    loadedCode: string | undefined,
    pluginOptions: StrictOptions
  ): Entrypoint | 'loop' {
    const { cache, eventEmitter } = services;
    return eventEmitter.perf('createEntrypoint', () => {
      const [status, entrypoint] = Entrypoint.innerCreate(
        services,
        parent
          ? {
              evaluated: parent.evaluated,
              log: parent.log,
              name: parent.name,
              parent: parent.parent,
            }
          : null,
        name,
        only,
        loadedCode,
        pluginOptions
      );

      if (status !== 'cached') {
        cache.add('entrypoints', name, entrypoint);
      }

      return status === 'loop' ? 'loop' : entrypoint;
    });
  }

  private static innerCreate(
    services: Services,
    parent: ParentEntrypoint,
    name: string,
    only: string[],
    loadedCode: string | undefined,
    pluginOptions: StrictOptions
  ): ['loop' | 'created' | 'cached', Entrypoint] {
    const { cache } = services;

    const cached = cache.get('entrypoints', name);
    const changed =
      loadedCode !== undefined
        ? cache.invalidateIfChanged(name, loadedCode)
        : false;

    if (!cached?.evaluated && cached?.ignored) {
      return ['cached', cached];
    }

    const exports = cached?.exports;
    const evaluatedOnly = cached?.evaluatedOnly ?? [];
    const mergedOnly =
      !changed && cached?.only
        ? mergeOnly(cached.only, only).filter((i) => !evaluatedOnly.includes(i))
        : only;

    if (cached?.evaluated) {
      cached.log('is already evaluated with', cached.evaluatedOnly);
    }

    if (!changed && cached && !cached.evaluated) {
      const isLoop = parent && ancestorOrSelf(name, parent) !== null;
      if (isLoop) {
        parent.log('[createEntrypoint] %s is a loop', name);
      }

      if (isSuperSet(cached.only, mergedOnly)) {
        cached.log('is cached', name);
        return [isLoop ? 'loop' : 'cached', cached];
      }

      cached.log(
        'is cached, but with different `only` %o (the cached one %o)',
        only,
        cached?.only
      );

      return [isLoop ? 'loop' : 'created', cached.supersede(mergedOnly)];
    }

    const newEntrypoint = new Entrypoint(
      services,
      parent,
      loadedCode,
      name,
      mergedOnly,
      pluginOptions,
      exports,
      evaluatedOnly,
      undefined,
      cached && 'resolveTasks' in cached ? cached.resolveTasks : undefined,
      cached && 'dependencies' in cached ? cached.dependencies : undefined,
      cached ? cached.generation + 1 : 1
    );

    if (cached && !cached.evaluated) {
      cached.log('is cached, but with different code');
      cached.supersede(newEntrypoint);
    }

    return ['created', newEntrypoint];
  }

  public abortIfSuperseded() {
    if (this.supersededWith) {
      this.log('superseded, aborting');
      throw new AbortError('superseded');
    }
  }

  public addDependency(dependency: IEntrypointDependency): void {
    this.resolveTasks.delete(dependency.source);
    this.dependencies.set(dependency.source, dependency);
  }

  public addResolveTask(
    name: string,
    dependency: Promise<IEntrypointDependency>
  ): void {
    this.resolveTasks.set(name, dependency);
  }

  public createAction<
    TType extends ActionTypes,
    TAction extends ActionByType<TType>,
  >(
    actionType: TType,
    data: TAction['data'],
    abortSignal: AbortSignal | null = null
  ): BaseAction<TAction> {
    if (!this.actionsCache.has(actionType)) {
      this.actionsCache.set(actionType, new Map());
    }

    const cache = this.actionsCache.get(actionType)!;
    const cached = cache.get(data);
    if (cached && !cached.abortSignal?.aborted) {
      return cached as BaseAction<TAction>;
    }

    const newAction = new BaseAction<TAction>(
      actionType as TAction['type'],
      this.services,
      this,
      data,
      abortSignal
    );

    cache.set(data, newAction);

    return newAction;
  }

  public createChild(
    name: string,
    only: string[],
    loadedCode?: string
  ): Entrypoint | 'loop' {
    return Entrypoint.create(
      this.services,
      this,
      name,
      only,
      loadedCode,
      this.pluginOptions
    );
  }

  public createEvaluated() {
    const evaluatedOnly = mergeOnly(this.evaluatedOnly, this.only);
    this.log('create EvaluatedEntrypoint for %o', evaluatedOnly);

    return new EvaluatedEntrypoint(
      this.services,
      evaluatedOnly,
      this.exports,
      this.generation + 1,
      this.name,
      this.only,
      this.parent
    );
  }

  public getDependency(name: string): IEntrypointDependency | undefined {
    return this.dependencies.get(name);
  }

  public getResolveTask(
    name: string
  ): Promise<IEntrypointDependency> | undefined {
    return this.resolveTasks.get(name);
  }

  public hasLinariaMetadata() {
    return this.#hasLinariaMetadata;
  }

  public onSupersede(callback: (newEntrypoint: Entrypoint) => void) {
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

  public setTransformResult(res: ITransformFileResult | null) {
    this.#hasLinariaMetadata = Boolean(res?.metadata);
    this.#transformResultCode = res?.code ?? null;
  }

  private supersede(newOnlyOrEntrypoint: string[] | Entrypoint): Entrypoint {
    const newEntrypoint =
      newOnlyOrEntrypoint instanceof Entrypoint
        ? newOnlyOrEntrypoint
        : new Entrypoint(
            this.services,
            this.parent,
            this.initialCode,
            this.name,
            newOnlyOrEntrypoint,
            this.pluginOptions,
            this.exports,
            this.evaluatedOnly,
            this.loadedAndParsed,
            this.resolveTasks,
            this.dependencies,
            this.generation + 1
          );

    this.log(
      'superseded by %s (%o -> %o)',
      newEntrypoint.name,
      this.only,
      newEntrypoint.only
    );
    this.#supersededWith = newEntrypoint;
    this.onSupersedeHandlers.forEach((handler) => handler(newEntrypoint));

    return newEntrypoint;
  }
}
