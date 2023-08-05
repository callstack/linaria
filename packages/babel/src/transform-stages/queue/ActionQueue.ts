// eslint-disable-next-line max-classes-per-file
import { relative, sep } from 'path';

import type { EventEmitter } from '@linaria/utils';

import type { Core } from '../../babel';
import type { TransformCacheCollection } from '../../cache';
import type { Options } from '../../types';

import type {
  EventsHandlers,
  IBaseNode,
  IBaseEntrypoint,
} from './PriorityQueue';
import { PriorityQueue } from './PriorityQueue';
import type {
  ActionQueueItem,
  IEntrypoint,
  IResolvedImport,
  IResolveImportsAction,
  BaseAction,
} from './types';

const peek = <T>(arr: T[]) =>
  arr.length > 0 ? arr[arr.length - 1] : undefined;

export type OnNext<TEvents extends Record<string, unknown[]>> = {
  on: <K extends keyof TEvents>(
    type: K,
    callback: (...args: TEvents[K]) => void
  ) => void;
};

export type Next<
  TEntrypoint extends IBaseEntrypoint,
  TNode extends IBaseNode<TEntrypoint>
> = <TType extends TNode['type']>(
  item: TNode & { type: TType },
  refCount?: number
) => Extract<TNode, { type: TType }> extends IBaseNode<
  TEntrypoint,
  infer TEvents
>
  ? OnNext<TEvents>
  : { on: (type: never, callback: never) => void };

type Merger<T extends ActionQueueItem> = (
  a: T,
  b: T,
  next: Next<IEntrypoint, ActionQueueItem>
) => void;

const reprocessEntrypoint: Merger<ActionQueueItem> = (a, b, next) => {
  const entrypoint: IEntrypoint = {
    ...a.entrypoint,
    only: Array.from(
      new Set([...a.entrypoint.only, ...b.entrypoint.only])
    ).sort(),
  };

  b.entrypoint.log('Superseded by %s', a.entrypoint.log.namespace);

  next({
    type: 'processEntrypoint',
    entrypoint,
    stack: a.stack,
    refCount: (a.refCount ?? 1) + (b.refCount ?? 1),
  });
};

const mergers: {
  [K in ActionQueueItem['type']]: Merger<Extract<ActionQueueItem, { type: K }>>;
} = {
  processEntrypoint: reprocessEntrypoint,
  resolveImports: (a, b, next) => {
    const mergedImports = new Map<string, string[]>();
    const addOrMerge = (v: string[], k: string) => {
      const prev = mergedImports.get(k);
      if (prev) {
        mergedImports.set(k, Array.from(new Set([...prev, ...v])).sort());
      } else {
        mergedImports.set(k, v);
      }
    };

    a.imports?.forEach(addOrMerge);
    b.imports?.forEach(addOrMerge);

    const merged: IResolveImportsAction = {
      ...a,
      imports: mergedImports,
    };

    next(merged);
  },
  processImports: (a, b, next) => {
    const mergedResolved: IResolvedImport[] = [];
    const addOrMerge = (v: IResolvedImport) => {
      const prev = mergedResolved.find(
        (i) => i.importedFile === v.importedFile
      );
      if (prev) {
        prev.importsOnly = Array.from(
          new Set([...prev.importsOnly, ...v.importsOnly])
        ).sort();
      } else {
        mergedResolved.push(v);
      }
    };

    a.resolved.forEach(addOrMerge);
    b.resolved.forEach(addOrMerge);
    const merged = {
      ...a,
      resolved: mergedResolved,
    };

    next(merged);
  },
  transform: reprocessEntrypoint,
  addToCodeCache: (a, b, next) => {
    const aOnly = a.entrypoint.only;
    const bOnly = b.entrypoint.only;
    if (aOnly.includes('*') || bOnly.every((i) => aOnly.includes(i))) {
      next(a);
      return;
    }

    if (bOnly.includes('*') || aOnly.every((i) => bOnly.includes(i))) {
      next(b);
      return;
    }

    reprocessEntrypoint(a, b, next);
  },
  getExports(a, b, next) {
    next(a);
  },
};

const weights: Record<ActionQueueItem['type'], number> = {
  addToCodeCache: 0,
  getExports: 20,
  processEntrypoint: 10,
  processImports: 15,
  resolveImports: 25,
  transform: 5,
};

function hasLessPriority(a: ActionQueueItem, b: ActionQueueItem) {
  if (a.type === b.type) {
    const firstA = peek(a.stack);
    const firstB = peek(b.stack);
    if (a.refCount === b.refCount && firstA && firstB) {
      const distanceA = relative(firstA, a.entrypoint.name).split(sep).length;
      const distanceB = relative(firstB, b.entrypoint.name).split(sep).length;
      return distanceA > distanceB;
    }

    return (a.refCount ?? 1) > (b.refCount ?? 1);
  }

  return weights[a.type] < weights[b.type];
}

const nameOf = (node: BaseAction): string =>
  `${node.type}:${node.entrypoint.name}`;

const keyOf = (node: BaseAction): string => nameOf(node);

function transferCallbacks<TEvents extends Record<string, unknown[]>>(
  from: IBaseNode<IBaseEntrypoint>[],
  to: IBaseNode<IBaseEntrypoint>
) {
  const targetCallbacks = (to.callbacks as EventsHandlers<TEvents>) ?? {};

  from.forEach((node) => {
    if (!node.callbacks) return;

    const callbacks = node.callbacks as EventsHandlers<TEvents>;
    Object.keys(callbacks).forEach((key) => {
      const name = key as keyof typeof targetCallbacks;
      const handlers = callbacks[name];
      if (!handlers) return;
      if (!targetCallbacks[name]) {
        targetCallbacks[name] = [];
      }

      handlers.forEach((handler) => {
        if (!handler) return;
        targetCallbacks[name]!.push(handler);
      });
    });
  });

  // eslint-disable-next-line no-param-reassign
  to.callbacks = targetCallbacks;
}

function merge(
  a: ActionQueueItem,
  b: ActionQueueItem,
  insert: (item: ActionQueueItem) => void
): void {
  if (a.type === b.type) {
    (
      mergers[a.type] as (
        a: ActionQueueItem,
        b: ActionQueueItem,
        next: (item: ActionQueueItem) => void
      ) => void
    )(a, b, (item) => {
      // Merge callbacks
      transferCallbacks([a, b], item);

      insert(item);
    });

    return;
  }

  throw new Error(`Cannot merge ${nameOf(a)} with ${nameOf(b)}`);
}

type Services = {
  babel: Core;
  cache: TransformCacheCollection;
  options: Pick<Options, 'root' | 'inputSourceMap'>;
  eventEmitter: EventEmitter;
};

type GetCallbacks<TAction extends ActionQueueItem> = TAction extends IBaseNode<
  IEntrypoint,
  infer TEvents
>
  ? {
      [K in keyof TEvents]: (...args: TEvents[K]) => void;
    }
  : never;

type Handler<TAction extends ActionQueueItem, TRes> = (
  services: Services,
  action: TAction,
  next: Next<IEntrypoint, ActionQueueItem>,
  callbacks: GetCallbacks<TAction>
) => TRes;

class GenericActionQueue<TRes> extends PriorityQueue<
  IEntrypoint,
  ActionQueueItem
> {
  constructor(
    protected services: Services,
    protected handlers: {
      [K in ActionQueueItem['type']]: Handler<
        Extract<ActionQueueItem, { type: K }>,
        TRes
      >;
    },
    entrypoint: IEntrypoint
  ) {
    const log = entrypoint.log.extend('queue');

    super(log, keyOf, merge, hasLessPriority);

    log('Created for entrypoint %s', entrypoint.name);

    this.enqueue({
      type: 'processEntrypoint',
      entrypoint,
      stack: [],
      refCount: 1,
    });
  }

  protected next<TType extends ActionQueueItem['type']>(
    item: ActionQueueItem & { type: TType },
    refCount = item.refCount ?? 1
  ) {
    type ResultType = Extract<
      ActionQueueItem,
      { type: TType }
    > extends BaseAction<infer TEvents>
      ? OnNext<TEvents>
      : { on: (type: never, callback: never) => void };

    const callbacks: Record<string, ((...args: unknown[]) => void)[]> =
      item.callbacks ?? {};

    this.enqueue({
      ...item,
      refCount,
      callbacks,
    });

    const on: ResultType['on'] = (
      type: string,
      callback: (...args: unknown[]) => void
    ) => {
      if (!callbacks[type]) {
        callbacks[type] = [];
      }

      callbacks[type]!.push(callback);
    };

    return {
      on,
    } as ResultType;
  }

  protected handle<TAction extends ActionQueueItem>(action: TAction): TRes {
    const { eventEmitter } = this.services;
    const handler = this.handlers[action.type] as Handler<TAction, TRes>;

    eventEmitter.single({
      type: 'queue-action',
      action: action.type,
      file: action.entrypoint.name,
      args: action.entrypoint.only,
    });

    const next = this.next.bind(this) as Next<IEntrypoint, ActionQueueItem>;

    type Callbacks = GetCallbacks<TAction>;
    const allCallbacks = action.callbacks as Record<
      keyof Callbacks,
      ((...args: unknown[]) => void)[] | undefined
    >;

    const callbacks = new Proxy({} as Callbacks, {
      get: (target, prop) => {
        const callbackName = prop.toString() as keyof Callbacks;
        return (...args: unknown[]) => {
          if (!action.callbacks) {
            return;
          }

          eventEmitter.single({
            type: 'queue-action',
            action: `${action.type}:${callbackName.toString()}`,
            file: action.entrypoint.name,
            args,
          });

          allCallbacks[callbackName]?.forEach((cb) => cb(...args));
        };
      },
    });

    return eventEmitter.pair(
      {
        method: `queue:${action.type}`,
      },
      () => handler(this.services, action, next, callbacks)
    );
  }
}

export class SyncActionQueue extends GenericActionQueue<void> {
  public runNext() {
    const next = this.dequeue();
    if (!next) {
      return;
    }

    this.handle(next);
  }
}

export class AsyncActionQueue extends GenericActionQueue<Promise<void> | void> {
  public async runNext() {
    const next = this.dequeue();
    if (!next) {
      return;
    }

    await this.handle(next);
  }
}
