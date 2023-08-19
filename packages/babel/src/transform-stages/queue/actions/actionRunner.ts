import { nanoid } from 'nanoid';

import type { IBaseEntrypoint } from '../../../types';
import type {
  IBaseServices,
  Handler,
  ActionQueueItem,
  AnyActionGenerator,
  Next,
  Continuation,
  GetGeneratorForRes,
} from '../types';

import { createAction, isContinuation, keyOf } from './action';

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

const lastEmittedBy = new WeakMap<ActionQueueItem, ActionQueueItem>();

function continueAction<
  TServices extends IBaseServices,
  TAction extends ActionQueueItem
>(services: TServices, continuation: Continuation<TAction>): IResults {
  const actions = new ListOfEmittedActions();
  const { action, generator } = continuation;

  const task = services.eventEmitter.pair(
    {
      method: `queue:${action.type}`,
    },
    () => {
      const processArgs = (
        result: IteratorResult<unknown, TAction['result']>
      ) => {
        if (result.done) {
          action.result = result.value;
          return result.value;
        }

        if (!isActionArgs(result.value)) {
          throw new Error('Invalid action');
        }

        actions.add({
          abortSignal: action.abortSignal,
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
        lastEmittedBy.set(action, nextAction);

        return nextAction;
      };

      const lastEmitted = lastEmittedBy.get(action);
      const next = (
        generator as
          | Generator<Parameters<Next>, ActionQueueItem['result']>
          | AsyncGenerator<Parameters<Next>, ActionQueueItem['result']>
      ).next(lastEmitted?.result);
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
function actionRunner<
  TServices extends IBaseServices,
  TAction extends ActionQueueItem,
  TRes extends Promise<void> | void
>(
  services: TServices,
  enqueue: (action: ActionQueueItem | Continuation) => void,
  action: TAction,
  queueIdx: string,
  handler: Handler<TServices, TAction, GetGeneratorForRes<TRes, TAction>>
): TRes;
function actionRunner<
  TServices extends IBaseServices,
  TAction extends ActionQueueItem,
  TRes extends Promise<void> | void
>(
  services: TServices,
  enqueue: (action: ActionQueueItem | Continuation) => void,
  continuation: Continuation<TAction>,
  queueIdx: string
): TRes;
function actionRunner<
  TServices extends IBaseServices,
  TAction extends ActionQueueItem,
  TRes extends Promise<void> | void
>(
  services: TServices,
  enqueue: (action: ActionQueueItem | Continuation) => void,
  actionOrContinuation: TAction | Continuation<TAction>,
  queueIdx: string,
  handler?: Handler<TServices, TAction, GetGeneratorForRes<TRes, TAction>>
): TRes {
  const action = isContinuation(actionOrContinuation)
    ? actionOrContinuation.action
    : actionOrContinuation;
  const generator = isContinuation(actionOrContinuation)
    ? actionOrContinuation.generator
    : (handler!(services, action) as Continuation<TAction>['generator']);

  const actionKey = keyOf(actionOrContinuation);

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
    const result = continueAction(services, {
      abortSignal: action.abortSignal,
      action,
      generator,
      uid: nanoid(16),
    });
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

export { actionRunner };
