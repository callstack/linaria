import { relative, sep } from 'path';

import type { Debugger } from '@linaria/logger';

import type { IBaseEntrypoint } from '../../types';

import { PriorityQueue } from './PriorityQueue';
import { createAction, getRefsCount, keyOf } from './actions/action';
import { actionRunner } from './actions/actionRunner';
import type {
  DataOf,
  ActionByType,
  IBaseAction,
  ActionQueueItem,
  IBaseServices,
  Handler,
  AnyActionGenerator,
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

export type Handlers<
  TRes extends AnyActionGenerator,
  TServices extends IBaseServices
> = {
  [K in ActionQueueItem['type']]: Handler<TServices, ActionByType<K>, TRes>;
};

export class GenericActionQueue<
  TRes extends AnyActionGenerator,
  TServices extends IBaseServices
> extends PriorityQueue<ActionQueueItem> {
  protected readonly queueIdx: string;

  protected readonly log: Debugger;

  protected readonly processed = new WeakMap<IBaseEntrypoint, Set<string>>();

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
    super(hasLessPriority);

    this.log = entrypoint.log.extend('queue');

    this.log('Created for entrypoint %s', entrypoint.name);
    this.queueIdx = entrypoint.idx;

    this.next('processEntrypoint', entrypoint, {});
  }

  protected override dequeue(): ActionQueueItem | undefined {
    let action: ActionQueueItem | undefined;
    // eslint-disable-next-line no-cond-assign
    while ((action = super.dequeue())) {
      if (!action?.abortSignal?.aborted) {
        this.log('Dequeued %s: %O', keyOf(action), this.data.map(keyOf));

        return action;
      }

      this.log('%s was aborted', keyOf(action));
    }

    return undefined;
  }

  protected override enqueue(newAction: ActionQueueItem) {
    const key = keyOf(newAction);

    if (!this.processed.has(newAction.entrypoint)) {
      this.processed.set(newAction.entrypoint, new Set());
    }

    const processed = this.processed.get(newAction.entrypoint)!;
    if (processed.has(key)) {
      this.log('Skip %s because it was already processed', key);
      return;
    }

    const onAbort = () => {
      this.services.eventEmitter.single({
        type: 'queue-action',
        queueIdx: this.queueIdx,
        action: `${newAction.type}:abort`,
        file: newAction.entrypoint.name,
        args: newAction.entrypoint.only,
      });
      this.delete(newAction);
    };

    newAction.abortSignal?.addEventListener('abort', onAbort);

    super.enqueue(newAction, () => {
      newAction.abortSignal?.removeEventListener('abort', onAbort);
    });

    processed.add(key);
    this.log('Enqueued %s: %O', key, this.data.map(keyOf));
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
