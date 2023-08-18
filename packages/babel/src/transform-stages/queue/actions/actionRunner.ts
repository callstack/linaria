import { nanoid } from 'nanoid';

import type { IBaseEntrypoint } from '../../../types';
import type {
  IBaseServices,
  Handler,
  ActionQueueItem,
  AnyActionGenerator,
  Next,
  Continuation,
} from '../types';

import { createAction, keyOf } from './action';

type QueueItem = ActionQueueItem | Continuation;

class ListOfEmittedActions {
  private readonly list: QueueItem[] = [];

  private readonly callbacks: ((action: QueueItem) => void)[] = [];

  public add(action: QueueItem) {
    this.list.push(action);
    this.callbacks.forEach((cb) => cb(action));
  }

  public onAdd(cb: (action: QueueItem) => void) {
    this.list.forEach(cb);
    this.callbacks.push(cb);
  }
}

interface IResults {
  actions: ListOfEmittedActions;
  task: unknown;
}

const cache = new WeakMap<IBaseEntrypoint, Map<string, IResults>>();

const isActionArgs = (value: unknown): value is Parameters<Next> => {
  if (!value) {
    return false;
  }

  if (!Array.isArray(value)) {
    return false;
  }

  if (value.length < 3 || value.length > 4) {
    return false;
  }

  const [type, entrypoint, , abortSignal] = value;
  if (typeof type !== 'string') {
    return false;
  }

  if (typeof entrypoint !== 'object') {
    return false;
  }

  return !abortSignal || abortSignal instanceof AbortSignal;
};

const isContinuation = <TAction extends ActionQueueItem>(
  value: TAction | Continuation<TAction>
): value is Continuation<TAction> => {
  if (!value) {
    return false;
  }

  if (typeof value !== 'object') {
    return false;
  }

  return 'action' in value && 'generator' in value;
};

function continueAction<
  TServices extends IBaseServices,
  TAction extends ActionQueueItem
>(
  services: TServices,
  continuation: Continuation<TAction>,
  queueIdx: string
): IResults {
  const actions = new ListOfEmittedActions();
  const { action, generator } = continuation;

  const task = services.eventEmitter.pair(
    {
      method: `queue:${action.type}`,
    },
    () => {
      const processArgs = (result: IteratorResult<unknown, unknown>) => {
        if (result.done) {
          // FIXME: Do something with result
          return result.value;
        }

        if (!isActionArgs(result.value)) {
          throw new Error('Invalid action');
        }

        actions.add({
          action,
          generator,
          uid: nanoid(16),
        });

        const [nextActionType, nextEntrypoint, nextData, nextAbortSignal] =
          result.value;
        const nextAction = createAction(
          nextActionType,
          nextEntrypoint,
          nextData,
          nextAbortSignal === undefined ? action.abortSignal : result.value[3]
        );

        actions.add(nextAction);

        return nextAction;
      };

      const next = generator.next();
      if (next instanceof Promise) {
        return next.then(processArgs);
      }

      return processArgs(next);
    }
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
  TRes extends AnyActionGenerator
>(
  services: TServices,
  enqueue: (action: ActionQueueItem | Continuation) => void,
  handler: Handler<TServices, TAction, TRes>,
  actionOrContinuation: TAction | Continuation<TAction>,
  queueIdx: string
): TRes {
  const action = isContinuation(actionOrContinuation)
    ? actionOrContinuation.action
    : actionOrContinuation;
  const generator = isContinuation(actionOrContinuation)
    ? actionOrContinuation.generator
    : (handler(services, action) as Continuation<TAction>['generator']);
  const actionKey = isContinuation(actionOrContinuation)
    ? `${keyOf(actionOrContinuation.action)}#${actionOrContinuation.uid}`
    : keyOf(actionOrContinuation);

  if (!cache.has(action.entrypoint)) {
    cache.set(action.entrypoint, new Map());
  }

  const entrypointCache = cache.get(action.entrypoint)!;
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
    const result = continueAction(
      services,
      {
        action,
        generator,
        uid: nanoid(16),
      },
      queueIdx
    );
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
