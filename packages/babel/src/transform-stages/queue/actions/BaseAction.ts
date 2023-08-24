import type { Entrypoint } from '../Entrypoint';
import type {
  ActionQueueItem,
  ActionTypes,
  AnyIteratorResult,
  Handlers,
  IBaseAction,
  ScenarioFor,
  Services,
  TypeOfResult,
  YieldResult,
} from '../types';
import { Pending } from '../types';

let actionIdx = 0;

export type ActionByType<
  TMode extends 'async' | 'sync',
  TType extends ActionTypes,
> = Extract<
  ActionQueueItem<TMode>,
  {
    type: TType;
  }
>;

type GetBase<
  TMode extends 'async' | 'sync',
  TAction extends ActionQueueItem<TMode>,
> = IBaseAction<TMode, TypeOfResult<TMode, TAction>, TAction['data']>;

export class BaseAction<
  TMode extends 'async' | 'sync',
  TType extends ActionTypes,
  TAction extends ActionByType<TMode, TType> = ActionByType<TMode, TType>,
> implements GetBase<TMode, TAction>
{
  result: TypeOfResult<TMode, TAction> | typeof Pending = Pending;

  public readonly idx: string;

  public constructor(
    public readonly mode: TMode,
    public readonly type: TType,
    public readonly services: Services,
    public readonly entrypoint: Entrypoint<TMode>,
    public readonly data: TAction['data'],
    public readonly abortSignal: AbortSignal | null,
    protected readonly handler: Handlers<TMode>[TType]
  ) {
    actionIdx += 1;
    this.idx = actionIdx.toString(16).padStart(6, '0');
  }

  public *getNext<
    TNextType extends ActionTypes,
    TNextAction extends ActionByType<TMode, TNextType> = ActionByType<
      TMode,
      TNextType
    >,
  >(
    type: TNextType,
    entrypoint: Entrypoint<TMode>,
    data: TNextAction['data'],
    abortSignal: AbortSignal | null = this.abortSignal
  ): Generator<
    [TNextType, Entrypoint<TMode>, TNextAction['data'], AbortSignal | null],
    TypeOfResult<TMode, TNextAction>,
    YieldResult<TMode>
  > {
    return (yield [type, entrypoint, data, abortSignal]) as TypeOfResult<
      TMode,
      TNextAction
    >;
  }

  private activeScenario: ScenarioFor<
    TMode,
    TypeOfResult<TMode, TAction>
  > | null = null;

  private activeScenarioNextResults: AnyIteratorResult<
    TMode,
    TypeOfResult<TMode, TAction>
  >[] = [];

  public run() {
    if (!this.activeScenario) {
      // FIXME: I spent two whole days trying to type all this generator stuff. I'm giving up for now.
      // @ts-expect-error
      this.activeScenario = this.handler.call(this);
      this.activeScenarioNextResults = [];
    }

    let nextIdx = 0;
    return {
      next: (arg: YieldResult<TMode>) => {
        if (this.activeScenarioNextResults.length <= nextIdx) {
          const nextResult = this.activeScenario!.next(arg);
          if ('then' in nextResult) {
            nextResult.then(
              (result) => {
                if (result.done) {
                  this.result = result.value;
                }
              },
              () => {}
            );
          } else if (nextResult.done) {
            this.result = nextResult.value;
          }

          this.activeScenarioNextResults.push(
            nextResult as AnyIteratorResult<TMode, TypeOfResult<TMode, TAction>>
          );
        }

        const nextResult = this.activeScenarioNextResults[nextIdx]!;
        nextIdx += 1;
        return nextResult;
      },
    };
  }
}
