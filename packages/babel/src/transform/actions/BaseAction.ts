/* eslint-disable no-plusplus */
import '../../utils/dispose-polyfill';
import type { Debugger } from '@linaria/logger';

import type { Entrypoint } from '../Entrypoint';
import type {
  ActionQueueItem,
  ActionTypes,
  AnyIteratorResult,
  AsyncScenarioForAction,
  Handler,
  IBaseAction,
  Services,
  SyncScenarioForAction,
  TypeOfResult,
  YieldResult,
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

  private activeScenarioError?: unknown;

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

  public get log(): Debugger {
    return this.entrypoint.log.extend(this.ref);
  }

  public get ref() {
    return `${this.type}@${this.idx}`;
  }

  public createAbortSignal(): AbortSignal & Disposable {
    const abortController = new AbortController();

    const unsubscribeFromParentAbort = this.onAbort(() => {
      this.entrypoint.log('parent aborted');
      abortController.abort();
    });

    const unsubscribeFromSupersede = this.entrypoint.onSupersede(() => {
      this.entrypoint.log('entrypoint superseded, aborting processing');
      abortController.abort();
    });

    const abortSignal = abortController.signal as AbortSignal & Disposable;
    abortSignal[Symbol.dispose] = () => {
      unsubscribeFromParentAbort();
      unsubscribeFromSupersede();
    };

    return abortSignal;
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

  public onAbort(fn: () => void): () => void {
    this.abortSignal?.addEventListener('abort', fn);

    return () => {
      this.abortSignal?.removeEventListener('abort', fn);
    };
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

    const throwFn = (e: unknown) =>
      this.emitAction(nextIdx, () => this.activeScenario!.throw(e));

    const nextFn = (arg: YieldResult) =>
      this.emitAction(nextIdx, () => this.activeScenario!.next(arg));

    const processNextResult = (
      result: IterationResult,
      onError?: (e: unknown) => void
    ) => {
      if ('then' in result) {
        result.then((r) => {
          if (r.done) {
            this.result = r.value;
          }
        }, onError);
      } else if (result.done) {
        this.result = result.value;
      }

      this.activeScenarioNextResults.push(result);
    };

    const processError = (e: unknown) => {
      if (this.activeScenarioNextResults.length > nextIdx) {
        this.log(
          'error was already handled in another branch, result idx is %d',
          nextIdx
        );
        return;
      }

      this.log('error processing, result idx is %d', nextIdx);

      try {
        const nextResult = throwFn(e);
        processNextResult(nextResult as IterationResult, processError);
      } catch (errorInGenerator) {
        const { recover } = handler;
        if (recover) {
          const nextResult = {
            done: false,
            value: recover(errorInGenerator, this),
          };

          processNextResult(nextResult as IterationResult, processError);
          return;
        }

        this.activeScenarioError = errorInGenerator;
        throw errorInGenerator;
      }
    };

    const processNext = (arg: YieldResult) => {
      if (this.activeScenarioNextResults.length > nextIdx) {
        this.log(
          'next was already handled in another branch, result idx is %d',
          nextIdx
        );
        return;
      }

      this.log('next processing, result idx is %d', nextIdx);

      try {
        const nextResult = nextFn(arg);
        processNextResult(nextResult as IterationResult, processError);
      } catch (e) {
        processError(e);
      }
    };

    return {
      next: (arg: YieldResult): IterationResult => {
        this.rethrowActiveScenarioError();
        processNext(arg);
        return this.activeScenarioNextResults[nextIdx++] as IterationResult;
      },
      throw: (e: unknown): IterationResult => {
        this.rethrowActiveScenarioError();
        processError(e);
        return this.activeScenarioNextResults[nextIdx++] as IterationResult;
      },
    };
  }

  protected emitAction<TRes>(yieldIdx: number, fn: () => TRes) {
    return this.services.eventEmitter.action(
      this.type,
      `${this.idx}:${yieldIdx + 1}`,
      this.entrypoint.ref,
      fn
    );
  }

  private rethrowActiveScenarioError() {
    if (!this.activeScenarioError) {
      return;
    }

    this.log(
      'scenario has an unhandled error from another branch, rethrow %o',
      this.activeScenarioError
    );

    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw this.activeScenarioError;
  }
}
