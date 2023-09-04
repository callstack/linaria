/* eslint-disable no-await-in-loop */
import type {
  ActionQueueItem,
  Handler,
  Handlers,
  TypeOfResult,
} from '../types';
import { Pending } from '../types';

import { AbortError } from './AbortError';
import type { BaseAction } from './BaseAction';

function getHandler<
  TMode extends 'async' | 'sync',
  TAction extends ActionQueueItem,
>(
  action: BaseAction<TAction>,
  actionHandlers: Handlers<TMode>
): Handler<TMode, TAction> {
  const handler = actionHandlers[action.type];
  if (!handler) {
    throw new Error(`No handler for action ${action.type}`);
  }

  // FIXME Handlers<TMode>[TAction['type']] is not assignable to Handler<TMode, TAction>
  return handler as unknown as Handler<TMode, TAction>;
}

const getActionRef = (type: string, entrypoint: { ref: string }) =>
  `${type}@${entrypoint.ref}`;

function assertIfAborted<TAction extends ActionQueueItem>(
  action: BaseAction<TAction>,
  stack: string[]
) {
  if (action.abortSignal?.aborted) {
    action.entrypoint.log('Action %s was aborted', stack.join('->'));
    throw new AbortError(stack[0]);
  }
}

export async function asyncActionRunner<TAction extends ActionQueueItem>(
  action: BaseAction<TAction>,
  actionHandlers: Handlers<'async' | 'sync'>,
  stack: string[] = [getActionRef(action.type, action.entrypoint)]
): Promise<TypeOfResult<TAction>> {
  assertIfAborted(action, stack);

  if (action.result !== Pending) {
    return action.result as TypeOfResult<TAction>;
  }

  const handler = getHandler(action, actionHandlers);
  const generator = action.run(handler);
  let result = await generator.next();
  while (!result.done) {
    const [type, entrypoint, data, abortSignal] = result.value;
    const nextAction = entrypoint.createAction(type, data, abortSignal);

    try {
      const actionResult = await asyncActionRunner(nextAction, actionHandlers, [
        ...stack,
        getActionRef(type, entrypoint),
      ]);
      result = await generator.next(actionResult);
    } catch (e) {
      if (handler.recover) {
        try {
          result = {
            done: false,
            value: handler.recover(e, action),
          };
        } catch (errorInRecover) {
          result = await generator.throw(errorInRecover);
        }
      } else {
        result = await generator.throw(e);
      }
    }
  }

  return result.value as TypeOfResult<TAction>;
}

export function syncActionRunner<TAction extends ActionQueueItem>(
  action: BaseAction<TAction>,
  actionHandlers: Handlers<'sync'>,
  stack: string[] = [getActionRef(action.type, action.entrypoint)]
): TypeOfResult<TAction> {
  if (action.result !== Pending) {
    return action.result as TypeOfResult<TAction>;
  }

  const handler = getHandler(action, actionHandlers);
  const generator = action.run(handler);
  let result = generator.next();
  while (!result.done) {
    assertIfAborted(action, stack);

    const [type, entrypoint, data, abortSignal] = result.value;
    const nextAction = entrypoint.createAction(type, data, abortSignal);

    try {
      const actionResult = syncActionRunner(nextAction, actionHandlers, [
        ...stack,
        getActionRef(type, entrypoint),
      ]);
      result = generator.next(actionResult);
    } catch (e) {
      if (handler.recover) {
        try {
          result = {
            done: false,
            value: handler.recover(e, action),
          };
        } catch (errorInRecover) {
          result = generator.throw(errorInRecover);
        }
      } else {
        result = generator.throw(e);
      }
    }
  }

  return result.value as TypeOfResult<TAction>;
}
