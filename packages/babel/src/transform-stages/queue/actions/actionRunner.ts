/* eslint-disable no-await-in-loop */
import type { Entrypoint } from '../Entrypoint';
import type { ActionQueueItem, TypeOfResult } from '../types';
import { Pending } from '../types';

export async function asyncActionRunner<
  TAction extends ActionQueueItem<'async' | 'sync'>,
>(action: TAction) {
  if (action.result !== Pending) {
    return action.result as TypeOfResult<'async' | 'sync', TAction>;
  }

  const generator = action.run();
  let result = await generator.next();
  while (!result.done) {
    const [type, entrypoint, data, abortSignal] = result.value;
    const nextAction = (
      entrypoint as Entrypoint<'async' | 'sync'>
    ).createAction(type, data, abortSignal);

    const actionResult = await asyncActionRunner(nextAction);

    result = await generator.next(actionResult);
  }

  return result.value as TypeOfResult<'async' | 'sync', TAction>;
}

export function syncActionRunner<TAction extends ActionQueueItem<'sync'>>(
  action: TAction
): TypeOfResult<'sync', TAction> {
  if (action.result !== Pending) {
    return action.result as TypeOfResult<'sync', TAction>;
  }

  const generator = action.run();
  let result = generator.next();
  while (!result.done) {
    const [type, entrypoint, data, abortSignal] = result.value;
    const nextAction = entrypoint.createAction(type, data, abortSignal);

    const actionResult = syncActionRunner(nextAction);

    result = generator.next(actionResult);
  }

  return result.value as TypeOfResult<'sync', TAction>;
}
