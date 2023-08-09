import type { EventEmitter } from '@linaria/utils';

import type { Core } from '../../babel';
import type { TransformCacheCollection } from '../../cache';
import type { Options } from '../../types';

import type { IBaseServices } from './GenericActionQueue';
import { GenericActionQueue } from './GenericActionQueue';
import type { ActionQueueItem, IEntrypoint } from './types';

type Services = {
  babel: Core;
  cache: TransformCacheCollection;
  options: Pick<Options, 'root' | 'inputSourceMap'>;
  eventEmitter: EventEmitter;
};

export class SyncActionQueue<
  TServices extends IBaseServices
> extends GenericActionQueue<void, TServices> {
  public runNext() {
    const next = this.dequeue();
    if (!next) {
      return;
    }

    next.entrypoint.log('Start %s from %r', next.type, this.logRef);
    this.handle(next);
    next.entrypoint.log('Finish %s from %r', next.type, this.logRef);
  }
}

export class AsyncActionQueue<
  TServices extends IBaseServices
> extends GenericActionQueue<Promise<void> | void, TServices> {
  private static taskCache = new WeakMap<
    ActionQueueItem,
    Promise<void> | void
  >();

  public async runNext() {
    const next = this.dequeue();
    if (!next) {
      return;
    }

    next.entrypoint.log('Start %s from %r', next.type, this.logRef);

    // Do not run same task twice
    if (!AsyncActionQueue.taskCache.has(next)) {
      AsyncActionQueue.taskCache.set(next, this.handle(next));
    } else {
      next.entrypoint.log('Reuse %s from another queue', next.type);
    }

    await AsyncActionQueue.taskCache.get(next);
    next.entrypoint.log('Finish %s from %r', next.type, this.logRef);
  }
}
