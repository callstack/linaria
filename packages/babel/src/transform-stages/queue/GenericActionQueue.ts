import { relative, sep } from 'path';

import type { IBaseEntrypoint } from '../../types';

import { PriorityQueue } from './PriorityQueue';
import { createAction, getRefsCount, keyOf } from './actions/action';
import { actionRunner } from './actions/actionRunner';
import { onSupersede } from './createEntrypoint';
import type {
  DataOf,
  ActionByType,
  IBaseAction,
  ActionQueueItem,
  IBaseServices,
  Handler,
} from './types';

const weights: Record<IBaseAction['type'], number> = {
  addToCodeCache: 0,
  transform: 5,
  explodeReexports: 10,
  processEntrypoint: 15,
  processImports: 20,
  getExports: 25,
  resolveImports: 30,
};

function hasLessPriority(a: IBaseAction, b: IBaseAction) {
  if (a.type === b.type) {
    const parentA = a.entrypoint.parent?.name;
    const parentB = b.entrypoint.parent?.name;
    const refCountA = getRefsCount(a.entrypoint);
    const refCountB = getRefsCount(b.entrypoint);
    if (refCountA === refCountB && parentA && parentB) {
      const distanceA = relative(parentA, a.entrypoint.name).split(sep).length;
      const distanceB = relative(parentB, b.entrypoint.name).split(sep).length;
      return distanceA > distanceB;
    }

    return refCountA > refCountB;
  }

  return weights[a.type] < weights[b.type];
}

export type Handlers<TRes, TServices extends IBaseServices> = {
  [K in ActionQueueItem['type']]: Handler<TServices, ActionByType<K>, TRes>;
};

export class GenericActionQueue<
  TRes,
  TServices extends IBaseServices
> extends PriorityQueue<ActionQueueItem> {
  protected readonly queueIdx: string;

  public get logRef() {
    return {
      namespace: this.log.namespace,
      text: `queue:${this.queueIdx}`,
    };
  }

  constructor(
    protected services: TServices,
    protected handlers: Handlers<TRes, TServices>,
    entrypoint: IBaseEntrypoint
  ) {
    const log = entrypoint.log.extend('queue');

    super(log, keyOf, hasLessPriority);

    log('Created for entrypoint %s', entrypoint.name);
    this.queueIdx = entrypoint.idx;

    this.next('processEntrypoint', entrypoint, {});
  }

  protected override dequeue(): ActionQueueItem | undefined {
    let action: ActionQueueItem | undefined;
    // eslint-disable-next-line no-cond-assign
    while ((action = super.dequeue())) {
      if (!action?.abortSignal?.aborted) {
        return action;
      }
    }

    return undefined;
  }

  protected override enqueue(newAction: ActionQueueItem) {
    const abortController = new AbortController();

    const onParentAbort = () => {
      abortController.abort();
    };

    if (newAction.abortSignal) {
      newAction.abortSignal.addEventListener('abort', onParentAbort);
    }

    const unsubscribe = onSupersede(newAction.entrypoint, (newEntrypoint) => {
      this.log(
        'superseded by %s (only: %s, refs: %d)',
        newEntrypoint.name,
        newEntrypoint.only,
        getRefsCount(newEntrypoint)
      );
      abortController.abort();
      this.next(newAction.type, newEntrypoint, newAction, null);
    });

    const onDequeue = () => {
      this.log('done processing %s', newAction.entrypoint.name);
      unsubscribe();
      newAction.abortSignal?.removeEventListener('abort', onParentAbort);
    };

    // const idx = this.keys.get(key);
    // if (idx !== undefined) {
    //   // Merge with existing entry
    //   const oldAction = this.data[idx];
    //   const mergeAction = onCollide(oldAction, newAction);
    //   console.log('mergeAction', mergeAction);
    //   debugger;
    //
    //   return;
    // }
    //
    super.enqueue(
      {
        ...newAction,
        abortSignal: abortController.signal,
      },
      onDequeue
    );
  }

  public next = <TType extends ActionQueueItem['type']>(
    actionType: TType,
    entrypoint: IBaseEntrypoint,
    data: DataOf<ActionByType<TType>>,
    abortSignal: AbortSignal | null = null
  ): ActionByType<TType> => {
    const action = createAction(actionType, entrypoint, data, abortSignal);

    this.enqueue(action);

    return action;
  };

  protected handle<TAction extends ActionQueueItem>(action: TAction): TRes {
    const handler = this.handlers[action.type as TAction['type']] as Handler<
      TServices,
      TAction,
      TRes
    >;

    return actionRunner<TServices, TAction, TRes>(
      this.services,
      this.enqueue.bind(this),
      handler,
      action,
      this.queueIdx
    );
  }
}
