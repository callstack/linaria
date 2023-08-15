// eslint-disable-next-line max-classes-per-file
import type { IBaseServices } from './GenericActionQueue';
import { GenericActionQueue } from './GenericActionQueue';
import type { ActionQueueItem } from './types';

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

  public runNext(): Promise<void> {
    const next = this.dequeue();
    if (!next) {
      return Promise.resolve();
    }

    next.entrypoint.log('Start %s from %r', next.type, this.logRef);

    // Do not run same task twice
    if (!AsyncActionQueue.taskCache.has(next)) {
      AsyncActionQueue.taskCache.set(
        next,
        this.handle(next) ?? Promise.resolve()
      );
    } else {
      next.entrypoint.log('Reuse %s from another queue', next.type);
    }

    const task = AsyncActionQueue.taskCache.get(next)!;
    task.then(
      () => {
        next.entrypoint.log('Finish %s from %r', next.type, this.logRef);
      },
      () => {}
    );

    return task;
  }
}
