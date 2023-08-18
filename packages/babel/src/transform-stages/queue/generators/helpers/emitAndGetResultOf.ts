import type { IBaseEntrypoint } from '../../../../types';
import type { ActionQueueItem, DataOf, IBaseAction, Next } from '../../types';

export function* emitAndGetResultOf<
  TAction extends Extract<ActionQueueItem, { type: TType }>,
  TType extends ActionQueueItem['type']
>(
  type: TType,
  entrypoint: IBaseEntrypoint,
  data: DataOf<TAction>,
  abortSignal?: AbortSignal | null
): Generator<
  Parameters<Next>,
  TAction extends IBaseAction<IBaseEntrypoint, infer TResult> ? TResult : never,
  TAction extends IBaseAction<IBaseEntrypoint, infer TResult> ? TResult : never
> {
  return yield [type, entrypoint, data, abortSignal];
}
