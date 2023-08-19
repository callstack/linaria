import { nanoid } from 'nanoid';

import type { IBaseEntrypoint } from '../../../types';
import type {
  IBaseServices,
  Handler,
  ActionQueueItem,
  Next,
  Continuation,
  GetGeneratorForRes,
} from '../types';

import { createAction, getWeight, isContinuation, keyOf } from './action';

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
  value?: unknown;
}

const cache = new WeakMap<IBaseEntrypoint, Map<string, IResults>>();

const isActionArgs = (value: unknown): value is Parameters<Next> => {
  if (!value) {
    return false;
  }

  if (!Array.isArray(value)) {
    return false;
  }

  if (value.length < 3 || value.length > 5) {
    return false;
  }

  const [type, entrypoint, , abortSignal, needResult] = value;
  if (typeof type !== 'string') {
    return false;
  }

  if (needResult !== undefined && typeof needResult !== 'boolean') {
    return false;
  }

  if (typeof entrypoint !== 'object') {
    return false;
  }

  return !abortSignal || abortSignal instanceof AbortSignal;
};

const taskResults = new WeakMap<IBaseEntrypoint, Map<string, unknown>>();
const addTaskResult = (
  entrypoint: IBaseEntrypoint,
  id: string,
  result: unknown
) => {
  if (!taskResults.has(entrypoint)) {
    taskResults.set(entrypoint, new Map());
  }

  taskResults.get(entrypoint)!.set(id, result);
};

const hasTaskResult = (entrypoint: IBaseEntrypoint, id: string) => {
  if (!taskResults.has(entrypoint)) {
    return false;
  }

  return taskResults.get(entrypoint)!.has(id);
};

const getTaskResult = (entrypoint: IBaseEntrypoint, id: string) => {
  if (!entrypoint || !taskResults.has(entrypoint)) {
    return undefined;
  }

  return taskResults.get(entrypoint)!.get(id);
};

let continuationIdx = 0;

function continueAction<
  TServices extends IBaseServices,
  TAction extends ActionQueueItem
>(services: TServices, continuation: Continuation<TAction>): IResults {
  const actions = new ListOfEmittedActions();
  const { action, generator, resultFrom, weight } = continuation;

  const task = services.eventEmitter.pair(
    {
      method: `queue:${action.type}`,
    },
    () => {
      const processArgs = (
        result: IteratorResult<unknown, TAction['result']>
      ) => {
        if (result.done) {
          addTaskResult(action.entrypoint, keyOf(action), result.value);
          action.entrypoint.log(
            '#%s %s returned %o',
            action.idx,
            keyOf(action),
            result.value
          );

          return result.value;
        }

        if (!isActionArgs(result.value)) {
          throw new Error('Invalid action');
        }

        const [
          nextActionType,
          nextEntrypoint,
          nextData,
          nextAbortSignal,
          needResult,
        ] = result.value;

        const nextAction = createAction(
          nextActionType,
          nextEntrypoint,
          nextData,
          nextAbortSignal === undefined ? action.abortSignal : result.value[3]
        );

        // Add continuation
        continuationIdx += 1;
        actions.add({
          abortSignal: action.abortSignal,
          action,
          generator,
          resultFrom: needResult
            ? [nextAction.entrypoint, keyOf(nextAction)]
            : undefined,
          uid: continuationIdx.toString(16).padStart(8, '0'),
          weight: needResult ? getWeight(nextAction) - 1 : weight,
        });

        if (needResult) {
          nextAction.entrypoint.log(
            '#%s %s needs result from %s',
            nextAction.idx,
            keyOf(action),
            keyOf(nextAction)
          );
        }

        // Add next action
        actions.add(nextAction);

        return nextAction;
      };

      if (resultFrom && !hasTaskResult(...resultFrom)) {
        throw new Error(
          `${resultFrom[1]} wasn't finished but ${keyOf(
            action
          )} tried to get result from it`
        );
      }

      const next = (
        generator as
          | Generator<Parameters<Next>, ActionQueueItem['result']>
          | AsyncGenerator<Parameters<Next>, ActionQueueItem['result']>
      ).next(resultFrom ? getTaskResult(...resultFrom) : undefined);
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
    const result = continueAction(
      services,
      isContinuation(actionOrContinuation)
        ? actionOrContinuation
        : {
            abortSignal: action.abortSignal,
            action,
            generator: handler!(services, action),
            uid: nanoid(16),
            weight: getWeight(action),
          }
    );
    result.actions.onAdd((nextAction) => {
      if (nextAction.abortSignal?.aborted) {
        return;
      }

      enqueue(nextAction);
    });

    entrypointCache.set(actionKey, result);
    return result.task as TRes;
  }

  action.entrypoint.log('replay actions %s', action.type);
  cached.actions.onAdd((nextAction) => {
    if (nextAction.abortSignal?.aborted) {
      return;
    }

    enqueue(nextAction);
  });

  return cached.task as TRes;
}

export { actionRunner };
