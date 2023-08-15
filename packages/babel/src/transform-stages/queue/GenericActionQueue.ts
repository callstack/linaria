import { relative, sep } from 'path';

import type { EventEmitter } from '@linaria/utils';

import type { IBaseEntrypoint } from '../../types';

import { PriorityQueue } from './PriorityQueue';
import { createAction, getRefsCount, keyOf } from './actions/action';
import type {
  DataOf,
  ActionByType,
  IBaseAction,
  ActionQueueItem,
  EventEmitters,
} from './types';

export interface IBaseServices {
  eventEmitter: EventEmitter;
}

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

export type Handler<
  TServices extends IBaseServices,
  TAction extends IBaseAction,
  TRes
> = (
  services: TServices,
  action: TAction,
  callbacks: EventEmitters<
    TAction extends IBaseAction<IBaseEntrypoint, infer TEvents>
      ? TEvents
      : Record<never, unknown[]>
  >
) => TRes;

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
    const key = keyOf(newAction);
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
    super.enqueue(newAction);
  }

  public next = <TType extends ActionQueueItem['type']>(
    actionType: TType,
    entrypoint: IBaseEntrypoint,
    data: DataOf<ActionByType<TType>>,
    abortSignal: AbortSignal | null = null
  ): ActionByType<TType> => {
    const action = createAction(
      actionType,
      entrypoint,
      data,
      abortSignal,
      this.next
    );

    this.enqueue(action);

    return action;
  };

  protected handle<TAction extends ActionQueueItem>(action: TAction): TRes {
    const { eventEmitter } = this.services;
    const handler = this.handlers[action.type as TAction['type']] as Handler<
      TServices,
      TAction,
      TRes
    >;

    eventEmitter.single({
      type: 'queue-action',
      queueIdx: this.queueIdx,
      action: action.type,
      file: action.entrypoint.name,
      args: action.entrypoint.only,
    });

    type Callbacks = EventEmitters<
      TAction extends IBaseAction<IBaseEntrypoint, infer TEvents>
        ? TEvents
        : Record<never, unknown[]>
    >;
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
            queueIdx: this.queueIdx,
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
      () => handler(this.services, action, callbacks)
    );
  }
}
