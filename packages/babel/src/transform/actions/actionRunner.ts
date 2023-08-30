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

export async function asyncActionRunner<TAction extends ActionQueueItem>(
  action: BaseAction<TAction>,
  actionHandlers: Handlers<'async' | 'sync'>
): Promise<TypeOfResult<TAction>> {
  if (action.abortSignal?.aborted) {
    throw new AbortError();
  }

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
      const actionResult = await asyncActionRunner(nextAction, actionHandlers);
      result = await generator.next(actionResult);
    } catch (e) {
      result = await generator.throw(e);
    }
  }

  return result.value as TypeOfResult<TAction>;
}

export function syncActionRunner<TAction extends ActionQueueItem>(
  action: BaseAction<TAction>,
  actionHandlers: Handlers<'sync'>
): TypeOfResult<TAction> {
  if (action.abortSignal?.aborted) {
    throw new AbortError();
  }

  if (action.result !== Pending) {
    return action.result as TypeOfResult<TAction>;
  }

  const handler = getHandler(action, actionHandlers);
  const generator = action.run(handler);
  let result = generator.next();
  while (!result.done) {
    const [type, entrypoint, data, abortSignal] = result.value;
    const nextAction = entrypoint.createAction(type, data, abortSignal);

    try {
      const actionResult = syncActionRunner(nextAction, actionHandlers);
      result = generator.next(actionResult);
    } catch (e) {
      result = generator.throw(e);
    }
  }

  return result.value as TypeOfResult<TAction>;
}
