/* eslint-disable no-plusplus */
import type { Entrypoint } from '../Entrypoint';
import type {
  ActionQueueItem,
  ActionTypes,
  AnyIteratorResult,
  AsyncScenarioForAction,
  IBaseAction,
  Services,
  TypeOfResult,
  YieldResult,
  SyncScenarioForAction,
  Handler,
} from '../types';
import { Pending } from '../types';

let actionIdx = 0;

export type ActionByType<TType extends ActionTypes> = Extract<
  ActionQueueItem,
  {
    type: TType;
  }
>;

type GetBase<TAction extends ActionQueueItem> = IBaseAction<
  TAction,
  TypeOfResult<TAction>,
  TAction['data']
>;

export class BaseAction<TAction extends ActionQueueItem>
  implements GetBase<TAction>
{
  public readonly idx: string;

  public result: TypeOfResult<TAction> | typeof Pending = Pending;

  private activeScenario:
    | SyncScenarioForAction<TAction>
    | AsyncScenarioForAction<TAction>
    | null = null;

  private activeScenarioNextResults: AnyIteratorResult<
    'async' | 'sync',
    TypeOfResult<TAction>
  >[] = [];

  public constructor(
    public readonly type: TAction['type'],
    public readonly services: Services,
    public readonly entrypoint: Entrypoint,
    public readonly data: TAction['data'],
    public readonly abortSignal: AbortSignal | null
  ) {
    actionIdx += 1;
    this.idx = actionIdx.toString(16).padStart(6, '0');
  }

  public *getNext<
    TNextType extends ActionTypes,
    TNextAction extends ActionByType<TNextType> = ActionByType<TNextType>,
  >(
    type: TNextType,
    entrypoint: Entrypoint,
    data: TNextAction['data'],
    abortSignal: AbortSignal | null = this.abortSignal
  ): Generator<
    [TNextType, Entrypoint, TNextAction['data'], AbortSignal | null],
    TypeOfResult<TNextAction>,
    YieldResult
  > {
    return (yield [
      type,
      entrypoint,
      data,
      abortSignal,
    ]) as TypeOfResult<TNextAction>;
  }

  public run<
    TMode extends 'async' | 'sync',
    THandler extends Handler<TMode, TAction> = Handler<TMode, TAction>,
  >(handler: THandler) {
    type IterationResult = AnyIteratorResult<TMode, TypeOfResult<TAction>>;

    if (!this.activeScenario) {
      this.activeScenario = handler.call(this);
      this.activeScenarioNextResults = [];
    }

    let nextIdx = 0;

    const processError = (e: unknown) => {
      const nextResult = this.activeScenario!.throw(e);
      this.activeScenarioNextResults.push(nextResult as IterationResult);
    };

    const processNext = (arg: YieldResult) => {
      if (this.activeScenarioNextResults.length > nextIdx) {
        return;
      }

      try {
        const nextResult = this.activeScenario!.next(arg);
        if ('then' in nextResult) {
          nextResult.then((result) => {
            if (result.done) {
              this.result = result.value;
            }
          }, processError);
        } else if (nextResult.done) {
          this.result = nextResult.value;
        }

        this.activeScenarioNextResults.push(nextResult as IterationResult);
      } catch (e) {
        processError(e);
      }
    };

    return {
      next: (arg: YieldResult): IterationResult => {
        processNext(arg);
        return this.activeScenarioNextResults[nextIdx++] as IterationResult;
      },
      throw: (e: unknown): IterationResult => {
        processError(e);
        return this.activeScenarioNextResults[nextIdx++] as IterationResult;
      },
    };
  }
}
