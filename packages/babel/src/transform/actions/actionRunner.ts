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

const ACTION_ERROR = Symbol('ACTION_ERROR');
type ActionError = [marker: typeof ACTION_ERROR, err: unknown];
const isActionError = (e: unknown): e is ActionError =>
  Array.isArray(e) && e[0] === ACTION_ERROR;

export async function asyncActionRunner<TAction extends ActionQueueItem>(
  action: BaseAction<TAction>,
  actionHandlers: Handlers<'async' | 'sync'>,
  stack: string[] = [getActionRef(action.type, action.entrypoint)]
): Promise<TypeOfResult<TAction>> {
  if (action.result !== Pending) {
    action.log('result is cached');
    return action.result as TypeOfResult<TAction>;
  }

  const handler = getHandler(action, actionHandlers);
  const generator = action.run<'async' | 'sync'>(handler);
  let actionResult: TypeOfResult<ActionQueueItem> | ActionError | undefined;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (action.abortSignal?.aborted) {
      action.log('action is aborted');
      generator.throw(new AbortError(stack[0]));
    }

    const result = await (isActionError(actionResult)
      ? generator.throw(actionResult[1])
      : generator.next(actionResult));
    if (result.done) {
      return result.value as TypeOfResult<TAction>;
    }

    const [type, entrypoint, data, abortSignal] = result.value;
    const nextAction = entrypoint.createAction(type, data, abortSignal);

    try {
      actionResult = await asyncActionRunner(nextAction, actionHandlers, [
        ...stack,
        getActionRef(type, entrypoint),
      ]);
    } catch (e) {
      nextAction.log('error', e);
      actionResult = [ACTION_ERROR, e];
    }
  }
}

export function syncActionRunner<TAction extends ActionQueueItem>(
  action: BaseAction<TAction>,
  actionHandlers: Handlers<'sync'>,
  stack: string[] = [getActionRef(action.type, action.entrypoint)]
): TypeOfResult<TAction> {
  if (action.result !== Pending) {
    action.log('result is cached');
    return action.result as TypeOfResult<TAction>;
  }

  const handler = getHandler(action, actionHandlers);
  const generator = action.run<'sync'>(handler);
  let actionResult: TypeOfResult<ActionQueueItem> | ActionError | undefined;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (action.abortSignal?.aborted) {
      action.log('action is aborted');
      generator.throw(new AbortError(stack[0]));
    }

    const result = isActionError(actionResult)
      ? generator.throw(actionResult[1])
      : generator.next(actionResult);
    if (result.done) {
      return result.value as TypeOfResult<TAction>;
    }

    const [type, entrypoint, data, abortSignal] = result.value;
    const nextAction = entrypoint.createAction(type, data, abortSignal);

    try {
      actionResult = syncActionRunner(nextAction, actionHandlers, [
        ...stack,
        getActionRef(type, entrypoint),
      ]);
    } catch (e) {
      nextAction.log('error', e);
      actionResult = [ACTION_ERROR, e];
    }
  }
}
