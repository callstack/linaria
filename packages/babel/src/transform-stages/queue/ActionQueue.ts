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

    const action = isContinuation(next) ? next.action : next;
    const { entrypoint, type } = action;
    const itemType = isContinuation(next) ? 'continuation' : 'action';
    const logArgs = [itemType, action.idx, type, this.logRef] as const;

    entrypoint.log('Start %s #%s %s from %r', ...logArgs);
    this.handle(next);
    entrypoint.log('Finish %s #%s %s from %r', ...logArgs);
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

    const action = isContinuation(next) ? next.action : next;
    const { entrypoint, type } = action;
    const itemType = isContinuation(next) ? 'continuation' : 'action';
    const logArgs = [itemType, action.idx, type, this.logRef] as const;

    entrypoint.log('Start %s #%s %s from %r', ...logArgs);
    const result = this.handle(next);
    const log = () => entrypoint.log('Finish %s #%s %s from %r', ...logArgs);
    if (result instanceof Promise) {
      result.then(log, () => {});
    } else {
      log();
    }

    return result;
  }
}
