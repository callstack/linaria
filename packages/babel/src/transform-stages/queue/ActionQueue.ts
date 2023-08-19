// eslint-disable-next-line max-classes-per-file
import { GenericActionQueue } from './GenericActionQueue';
import { isContinuation } from './actions/action';
import type { IBaseServices } from './types';

export class SyncActionQueue<
  TServices extends IBaseServices
> extends GenericActionQueue<void, TServices> {
  public runNext() {
    const next = this.dequeue();
    if (!next) {
      return;
    }

    const { entrypoint, type } = isContinuation(next) ? next.action : next;

    entrypoint.log('Start %s from %r', type, this.logRef);
    this.handle(next);
    entrypoint.log('Finish %s from %r', type, this.logRef);
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

    const { entrypoint, type } = isContinuation(next) ? next.action : next;

    entrypoint.log('Start %s from %r', type, this.logRef);
    const result = this.handle(next);
    const log = () => entrypoint.log('Finish %s from %r', type, this.logRef);
    if (result instanceof Promise) {
      result.then(log, () => {});
    } else {
      log();
    }

    return result;
  }
}
