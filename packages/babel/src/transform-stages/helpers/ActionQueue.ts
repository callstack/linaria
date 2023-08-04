// eslint-disable-next-line max-classes-per-file
import { relative, sep } from 'path';

import type { EventEmitter } from '@linaria/utils';

import type { Core } from '../../babel';
import type { TransformCacheCollection } from '../../cache';
import type { Options } from '../../types';
import type { IBaseNode, Next as GenericNext } from '../queue/PriorityQueue';
import { PriorityQueue } from '../queue/PriorityQueue';
import type {
  ActionQueueItem,
  IEntrypoint,
  IGetExportsAction,
  IResolvedImport,
  IResolveImportsAction,
} from '../queue/types';

const peek = <T>(arr: T[]) =>
  arr.length > 0 ? arr[arr.length - 1] : undefined;

export type Next = GenericNext<ActionQueueItem>;

type Merger<T extends ActionQueueItem> = (a: T, b: T, next: Next) => void;

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
      callback: (resolved) => {
        a.callback?.(resolved);
        b.callback?.(resolved);
      },
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
    const merged: IGetExportsAction = {
      ...a,
      callback: (exports) => {
        a.callback?.(exports);
        b.callback?.(exports);
      },
    };

    next(merged);
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

const nameOf = (node: IBaseNode): string =>
  `${node.type}:${node.entrypoint.name}`;

const keyOf = (node: IBaseNode): string => nameOf(node);

function merge<T extends ActionQueueItem>(
  a: T,
  b: ActionQueueItem,
  next: Next
): void {
  if (a.type === b.type) {
    return (mergers[a.type] as (a: T, b: T, next: Next) => void)(
      a,
      b as T,
      next
    );
  }

  throw new Error(`Cannot merge ${nameOf(a)} with ${nameOf(b)}`);
}

type Services = {
  babel: Core;
  cache: TransformCacheCollection;
  options: Pick<Options, 'root' | 'inputSourceMap'>;
  eventEmitter: EventEmitter;
};

type Handler<TAction extends ActionQueueItem['type'], TRes> = (
  services: Services,
  action: Extract<ActionQueueItem, { type: TAction }>,
  next: Next
) => TRes;

class GenericActionQueue<TRes> extends PriorityQueue<ActionQueueItem> {
  constructor(
    protected services: Services,
    protected handlers: {
      [K in ActionQueueItem['type']]: Handler<K, TRes>;
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

  protected handle<T extends ActionQueueItem['type']>(
    action: Extract<ActionQueueItem, { type: T }>
  ): TRes {
    const { eventEmitter } = this.services;
    const handler = this.handlers[action.type] as Handler<T, TRes>;

    eventEmitter.single({
      type: 'queue-action',
      action: action.type,
      file: action.entrypoint.name,
      only: action.entrypoint.only.join(','),
    });

    return eventEmitter.autoPair(
      {
        method: `queue:${action.type}`,
      },
      () =>
        handler(this.services, action, (item, refCount = 1) =>
          this.enqueue({
            ...item,
            refCount,
          } as ActionQueueItem)
        )
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
