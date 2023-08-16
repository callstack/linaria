import type { IBaseEntrypoint } from '../../../types';
import type {
  IBaseAction,
  EventEmitters,
  IBaseServices,
  Handler,
  ActionQueueItem,
} from '../types';

import { createAction, keyOf } from './action';

class ListOfEmittedActions {
  private readonly list: ActionQueueItem[] = [];

  private readonly callbacks: ((action: ActionQueueItem) => void)[] = [];

  public add(action: ActionQueueItem) {
    this.list.push(action);
    this.callbacks.forEach((cb) => cb(action));
  }

  public onAdd(cb: (action: ActionQueueItem) => void) {
    this.list.forEach(cb);
    this.callbacks.push(cb);
  }
}

interface IResults {
  actions: ListOfEmittedActions;
  task: unknown;
}

const cache = new WeakMap<IBaseEntrypoint, Map<string, IResults>>();

function run<
  TServices extends IBaseServices,
  TAction extends ActionQueueItem,
  TRes
>(
  services: TServices,
  handler: Handler<TServices, TAction, TRes>,
  action: TAction,
  queueIdx: string
): IResults {
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

        services.eventEmitter.single({
          type: 'queue-action',
          queueIdx,
          action: `${action.type}:${callbackName.toString()}`,
          file: action.entrypoint.name,
          args,
        });

        allCallbacks[callbackName]?.forEach((cb) => cb(...args));
      };
    },
  });

  const actions = new ListOfEmittedActions();

  const task = services.eventEmitter.pair(
    {
      method: `queue:${action.type}`,
    },
    () =>
      handler(
        services,
        action,
        (type, entrypoint, data, abortSignal) => {
          const nextAction = createAction(
            type,
            entrypoint,
            data,
            abortSignal === undefined ? action.abortSignal : abortSignal
          );

          actions.add(nextAction);

          return nextAction;
        },
        callbacks
      )
  );

  return { actions, task };
}

/**
 * actionRunner ensures that each action is only run once per entrypoint.
 * If action is already running, it will re-emmit actions from the previous run.
 */
export function actionRunner<
  TServices extends IBaseServices,
  TAction extends ActionQueueItem,
  TRes
>(
  services: TServices,
  enqueue: (action: ActionQueueItem) => void,
  handler: Handler<TServices, TAction, TRes>,
  action: TAction,
  queueIdx: string
): TRes {
  if (!cache.has(action.entrypoint)) {
    cache.set(action.entrypoint, new Map());
  }

  const entrypointCache = cache.get(action.entrypoint)!;
  const actionKey = keyOf(action);
  const cached = entrypointCache.get(actionKey);
  services.eventEmitter.single({
    type: 'queue-action',
    queueIdx,
    action: `${action.type}:${cached ? 'replay' : 'run'}`,
    file: action.entrypoint.name,
    args: action.entrypoint.only,
  });

  if (!cached) {
    action.entrypoint.log('run action %s', action.type);
    const result = run(services, handler, action, queueIdx);
    result.actions.onAdd((nextAction) => {
      enqueue(nextAction);
    });

    entrypointCache.set(actionKey, result);
    return result.task as TRes;
  }

  action.entrypoint.log('replay actions %s', action.type);
  cached.actions.onAdd((nextAction) => {
    enqueue(nextAction);
  });

  return cached.task as TRes;
}
