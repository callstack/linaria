// eslint-disable-next-line max-classes-per-file
import { GenericActionQueue } from './GenericActionQueue';
import type { IBaseServices } from './types';

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
  public runNext(): Promise<void> | void {
    const next = this.dequeue();
    if (!next) {
      return Promise.resolve();
    }

    next.entrypoint.log('Start %s from %r', next.type, this.logRef);
    const result = this.handle(next);
    const log = () =>
      next.entrypoint.log('Finish %s from %r', next.type, this.logRef);
    if (result instanceof Promise) {
      result.then(log, () => {});
    } else {
      log();
    }

    return result;
  }
}
